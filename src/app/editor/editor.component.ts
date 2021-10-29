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
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onGateLoaded(): void {
    this.graph = this.graphService.createEditorGraph(
      this.graphCanvas.nativeElement
    );

    const v1 = this.graph.addVertex(126, 126);
    const v2 = this.graph.addVertex(126, 184);
    const v3 = this.graph.addVertex(184, 184);
    const v4 = this.graph.addVertex(184, 126);
    this.graph.addEdge(v1, v2);
    this.graph.addEdge(v2, v3);
    this.graph.addEdge(v3, v4);
    this.graph.addEdge(v1, v4);
  }
}
