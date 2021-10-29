import { Injectable, EventEmitter } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

import { Point, Gate } from './gate-types';
import { ExpFile, FlowgateService } from './flowgate.service';


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

  constructor(private readonly flowgateService: FlowgateService) {}

  loadGate(expFileId: string): void {
    this.flowgateService.getFileInfoWithGateTree(expFileId)
      .subscribe((expFile) => {
        this.expFile = expFile;

        this.gateParameters = expFile.channels.map(c => c.shortName);

        if (this.gateParameters.length < 2) {
          this.gateParameters = [...this.gateParameters, ...['FSC-A', 'FSC-H']];
        }

        if (expFile.gates.length > 0) {
        } else {
          this.rootGate = this.createDefaultGate();
        }

        this.currentGate = this.rootGate;

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
    const parent: Gate = gate.parent;

    const i = parent.children.indexOf(gate);

    if (i >= 0) {
      parent.children.splice(i, 1);
    }

    return parent;
  }

  createDefaultGate(): Gate {
    return {
      name: `${this.gateParameters[0]} vs. ${this.gateParameters[1]}`,
      x: this.gateParameters[0],
      y: this.gateParameters[1],
      points: [],
      children: [],
      parent: this.rootGate,
      customName: false,
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
}
