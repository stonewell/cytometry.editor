import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';

import { GraphService } from '../shared/graph.service';
import { Graph } from '../shared/graph-types';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('canvas', {'static': true}) graphCanvas: ElementRef;

  graph: Graph;

  constructor(private readonly container: ElementRef,
              private readonly graphService: GraphService) { }

  ngOnInit(): void {
    this.graph = this.graphService.createGraph(this.graphCanvas.nativeElement);

    const v1 = this.graph.addVertex(0, 0);
    const v2 = this.graph.addVertex(42, 84);
    this.graph.addEdge(v1, v2);
  }
}
