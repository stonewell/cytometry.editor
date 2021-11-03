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

@Component({
  selector: 'app-gates',
  templateUrl: './gates.component.html',
  styleUrls: ['./gates.component.css'],
})
export class GatesComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();

  @ViewChild('canvas', { static: true }) graphCanvas: ElementRef;

  graph: GateGraph;

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
    this.graph = this.graphService.createGateGraph(
      this.graphCanvas.nativeElement
    );

    this.graph.addRoot();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onGateNameUpdated(): void {
    this.graph.updateCurrentGateLabel();
  }
}
