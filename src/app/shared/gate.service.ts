import { Injectable, EventEmitter } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

import { Point, Gate, gateFromJSON, gateToJSON } from './gate-types';
import { ExpFile, FlowgateService, GatePlotMargin } from './flowgate.service';
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

  private expFile: ExpFile;

  constructor(private readonly flowgateService: FlowgateService) {
    this.currentGateUpdated
      .pipe(
        tap((evt) => console.log(`current gate  updated:${evt}, ${this.currentGate.plotKey}`)),

        filter((evt) => evt !== 'plot' && evt !== 'points'),

        mergeMap((evt) => this.updateGatePlot())
      )
      .subscribe((_) => {
        this.notifyCurrentGateUpdated('plot');
      });
  }

  loadGate(expFileId: string): void {
    this.flowgateService
      .getFileInfoWithGateTree(expFileId)
      .subscribe((expFile) => {
        this.expFile = expFile;

        this.gateParameters = expFile.channels.map((c) => c.shortName);

        if (this.gateParameters.length < 2) {
          this.gateParameters = [...this.gateParameters, ...['FSC-A', 'FSC-H']];
        }

        if (expFile.gates.length > 0) {
          console.log(expFile.gates[0].gateJson);
        } else {
          this.rootGate = this.createDefaultGate();
        }

        this.currentGate = this.rootGate;

        this.updateGatePlot().subscribe((_) => {
          this.notifyCurrentGateUpdated('plot');
        });

        console.log(`gate loaded for file:${expFile.title}`);

        this.gateLoaded.emit(true);
      });
  }

  getGateInfo(): any {
    return this.gateInfo;
  }

  getGatePlotUri(gate: Gate): string {
    return '';
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
        {x: 250 / 600.0, y: 250 / 600.0},
        {x: 350 / 600.0, y: 250 / 600.0},
        {x: 350 / 600.0, y: 350 / 600.0},
        {x: 250 / 600.0, y: 350 / 600.0},
      ],
      children: [],
      parent: this.rootGate,
      customName: false,
      plotKey: uuidv4(),
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
    )
  }
}
