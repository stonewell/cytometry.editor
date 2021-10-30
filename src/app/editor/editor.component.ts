import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { GraphService } from '../shared/graph.service';
import { EditorGraph } from '../shared/editor-graph-types';

import { FlowgateService } from '../shared/flowgate.service';
import { GateService } from '../shared/gate.service';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) graphCanvas: ElementRef;

  graph: EditorGraph;
  subscription: Subscription = new Subscription();

  constructor(
    private readonly container: ElementRef,
    private readonly graphService: GraphService,
    private readonly flowgateService: FlowgateService,
    private readonly gateService: GateService
  ) {}

  ngOnInit(): void {
    this.subscription.add(this.gateService.gateLoaded.subscribe((_) => {
      this.onGateLoaded();
    }));
    this.subscription.add(
      this.gateService.currentGateUpdated.subscribe((_: any) => {
        this.onGateUpdated();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onGateLoaded(): void {
    this.graph = this.graphService.createEditorGraph(
      this.graphCanvas.nativeElement
    );

    this.loadCurrentGate();
  }

  onGateUpdated(): void {
    this.loadCurrentGate();
  }

  loadCurrentGate(): void {
    const currentGate = this.gateService.getCurrentGate();
    this.graph.clear();

    if (currentGate?.points?.length > 0) {
      let lastVertex = undefined;
      let firstVertex = undefined;

      for (const pt of currentGate.points) {
        let v = this.graph.addVertex(pt.x, pt.y);

        if (lastVertex) {
          this.graph.addEdge(lastVertex, v);
        }

        lastVertex = v;

        if (!firstVertex) {
          firstVertex = v;
        }
      }

      if (lastVertex && firstVertex) {
        this.graph.addEdge(lastVertex, firstVertex);
      }
    } else {
      const v1 = this.graph.addVertex(0, 0);
      const v2 = this.graph.addVertex(0, 58);
      const v3 = this.graph.addVertex(58, 58);
      const v4 = this.graph.addVertex(58, 0);
      this.graph.addEdge(v1, v2);
      this.graph.addEdge(v2, v3);
      this.graph.addEdge(v3, v4);
      this.graph.addEdge(v1, v4);
    }
  }
}
