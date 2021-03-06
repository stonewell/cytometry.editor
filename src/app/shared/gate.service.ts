import { Injectable, EventEmitter } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

import {
  Point,
  Gate,
  Transform,
  TransformType,
  gateFromJSON,
  gateToJSON,
  GatingMethod,
} from './gate-types';
import {
  ExpFile,
  FlowgateService,
  GatePlotMargin,
  ExpFileTransform,
} from './flowgate.service';
import { mergeAll, mergeMap, switchMap, filter, tap } from 'rxjs/operators';

import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class GateService {
  currentGateUpdated: EventEmitter<any> = new EventEmitter();
  gateLoaded: EventEmitter<any> = new EventEmitter();

  private rootGate: Gate;
  private currentGate: Gate;
  private gateInfo: any;

  gateParameters: string[] = [];
  gateParametersDisplay: string[] = [];
  predefinedTransforms: string[] = [];

  private expFile: ExpFile;

  constructor(private readonly flowgateService: FlowgateService) {
    this.currentGateUpdated
      .pipe(
        filter((evt) => evt !== 'plot' && evt !== 'points'),

        mergeMap((evt) => this.updateGatePlot())
      )
      .subscribe((_) => {
        this.notifyCurrentGateUpdated('plot');
      });
  }

  loadGate(expFileId: string, gateEditSession: string, newGate: boolean): void {
    this.flowgateService
      .getFileInfoWithGateTree(expFileId, gateEditSession)
      .subscribe((expFile) => {
        this.expFile = expFile;

        this.gateParameters = expFile.channels.map((c) => c.shortName);
        this.gateParametersDisplay = expFile.channels.map((c) => `${c.shortName}(${c.name})`);

        if (this.gateParameters.length < 2) {
          this.gateParameters = [...this.gateParameters, ...['FSC-A', 'FSC-H']];
        }

        this.predefinedTransforms = expFile.predefinedTransforms.map(
          (t: ExpFileTransform) => t.transformName
        );

        if (expFile.gate && !newGate) {
          console.log(expFile.gate.gateJson);
          this.rootGate = gateFromJSON(expFile.gate.gateJson);
        } else {
          this.rootGate = this.createDefaultGate();
        }

        this.currentGate = this.rootGate;

        this.updateGatePlot().subscribe((_) => {
          this.notifyCurrentGateUpdated('plot');
        });

        this.gateLoaded.emit(true);
      });
  }

  getGatePlotMargin(): GatePlotMargin {
    return this.expFile.plotMargin;
  }

  addGate(parent: Gate | null, child: Gate | null = null): Gate {
    if (parent === null) {
      parent = this.rootGate;
    }

    if (child === null) {
      child = this.createDefaultGate();
    }

    child.parent = parent as Gate;
    parent.children.push(child);

    return child;
  }

  /*
    reutrn parent gate
   */
  removeGate(gate: Gate): Gate {
    const parent = gate.parent;

    if (parent) {
      const i = parent.children.indexOf(gate);

      if (i >= 0) {
        parent.children.splice(i, 1);
      }
    }

    return parent as Gate;
  }

  createDefaultGate(): Gate {
    return {
      name: `${this.gateParameters[0]} vs. ${this.gateParameters[1]}`,
      x: this.gateParameters[0],
      y: this.gateParameters[1],
      points: [
        { x: 250 / 600.0, y: 250 / 600.0 },
        { x: 350 / 600.0, y: 250 / 600.0 },
        { x: 350 / 600.0, y: 350 / 600.0 },
        { x: 250 / 600.0, y: 350 / 600.0 },
      ],
      children: [],
      parent: this.rootGate,
      customName: false,
      plotKey: uuidv4(),
      xTransform: this.getDefaultTransform(this.gateParameters[0]),
      yTransform: this.getDefaultTransform(this.gateParameters[1]),
    };
  }

  getCurrentGate(): Gate {
    return this.currentGate;
  }

  setCurrentGate(g: Gate) {
    if (this.currentGate === g) {
      return;
    }

    this.currentGate = g;
    this.currentGateUpdated.emit(null);
  }

  getRootGate(): Gate {
    return this.rootGate;
  }

  notifyCurrentGateUpdated(evt: any = null): void {
    this.currentGateUpdated.emit(evt);
  }

  updateGatePlot() {
    return this.flowgateService.updateGatePlot(
      this.expFile,
      gateToJSON(this.rootGate)
    );
  }

  expFileTransformToTransform(expT: ExpFileTransform): Transform {
    const v = expT.parameterValues;

    return {
      transformType: this.expFileTranformTypeToTransformType(expT),
      a: v['a'] || 0,
      t: v['t'] || 0,
      m: v['m'] || 0,
      w: v['w'] || 0,
      predefinedName: expT.transformName,
    };
  }

  getDefaultTransform(channel: string): Transform {
    const t = this.expFile.defaultTransforms
      .filter((t: ExpFileTransform) => {
        return t.channel === channel;
      })
      .map((t: ExpFileTransform) => this.expFileTransformToTransform(t));

    if (t.length > 0) return t[0];

    return this.defaultTransform();
  }

  getAutoTransform(channel: string): Transform {
    const t = this.expFile.autoTransforms
      .filter((t: ExpFileTransform) => {
        return t.channel === channel;
      })
      .map((t: ExpFileTransform) => this.expFileTransformToTransform(t));

    if (t.length > 0) return t[0];

    return this.defaultTransform();
  }

  expFileTranformTypeToTransformType(expT: ExpFileTransform): TransformType {
    return !expT.transformType || expT.isPredefined
      ? TransformType.predefined
      : (expT.transformType as TransformType);
  }

  defaultTransform(): Transform {
    return {
      transformType: TransformType.none,
      a: 0,
      t: 0,
      m: 0,
      w: 0,
      predefinedName: '',
    };
  }

  gateEditSession(): string {
    return this.expFile.gateEditSession;
  }

  expFileId(): string {
    return `${this.expFile.id}`;
  }

  isDAFiGating(): boolean {
    return this.rootGate?.gatingMethod === GatingMethod.dafi;
  }
}
