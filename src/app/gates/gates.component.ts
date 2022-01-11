import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { Subscription } from 'rxjs';

import { GraphService } from '../shared/graph.service';
import { GateGraph } from '../shared/gate-graph-types';
import { GateService } from '../shared/gate.service';
import { GatingMethod } from '../shared/gate-types';

@Component({
  selector: 'app-gates',
  templateUrl: './gates.component.html',
  styleUrls: ['./gates.component.css'],
})
export class GatesComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();

  @ViewChild('canvas', { static: true }) graphCanvas: ElementRef;

  graph: GateGraph;

  gateLoaded: boolean = false;

  constructor(
    private readonly container: ElementRef,
    private readonly graphService: GraphService,
    private readonly gateService: GateService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.gateService.gateLoaded.subscribe((_) => {
        this.onGateLoaded();
      })
    );

    this.subscription.add(
      this.gateService.currentGateUpdated.subscribe((evt: any) => {
        if (evt !== 'points') {
          this.onGateNameUpdated();
        }
      })
    );
  }

  onGateLoaded(): void {
    if (this.graph) {
      this.graph.clear();
    } else {
      this.graph = this.graphService.createGateGraph(
        this.graphCanvas.nativeElement
      );
    }

    this.graph.addRoot();

    this.gateLoaded = true;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onGateNameUpdated(): void {
    this.graph.updateCurrentGateLabel();
  }

  get gatingMethod(): typeof GatingMethod {
    return GatingMethod;
  }

  onGatingMethodChange(gm: GatingMethod): void {
    this.gateService.getRootGate().gatingMethod = gm;
    this.gateService.notifyCurrentGateUpdated('gatingMethod');
  }

  get currentGatingMethod(): GatingMethod {
    if (this.gateService.getRootGate()) {
      return this.gateService.getRootGate().gatingMethod || GatingMethod.dafi;
    }

    return GatingMethod.dafi;
  }

  onGateResetClicked(): void {
    this.gateLoaded = false;
    const expFileId = this.gateService.expFileId();

    this.gateService.loadGate(expFileId, '', false);
  }

  onNewGateClicked(): void {
    this.gateLoaded = false;
    const expFileId = this.gateService.expFileId();

    this.gateService.loadGate(expFileId, '', true);
  }
}
