import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';

import { MXGraph, MXGraphService } from '../shared/mxgraph.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('canvas', {'static': true}) graphCanvas: ElementRef;

  graph: MXGraph;

  constructor(private readonly container: ElementRef,
              private readonly graphService: MXGraphService) { }

  ngOnInit(): void {
    this.graph = this.graphService.createMXGraph(this.graphCanvas.nativeElement);

    const v1 = this.graph.addVertex(0, 0);
    const v2 = this.graph.addVertex(42, 84);
    this.graph.addEdge(v1, v2);
  }
}
