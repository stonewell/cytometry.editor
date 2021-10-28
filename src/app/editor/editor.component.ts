import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';

import { GraphService } from '../shared/graph.service';
import { EditorGraph } from '../shared/editor-graph-types';

import { FlowgateService } from '../shared/flowgate.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
  @ViewChild('canvas', { static: true }) graphCanvas: ElementRef;

  graph: EditorGraph;

  constructor(
    private readonly container: ElementRef,
    private readonly graphService: GraphService,
    private readonly flowgateService: FlowgateService
  ) {}

  ngOnInit(): void {
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

    this.flowgateService.getFileInfo('');
  }
}
