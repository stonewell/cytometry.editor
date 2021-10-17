import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';

import { GraphService } from '../shared/graph.service';
import { GateGraph } from '../shared/gate-graph-types';

@Component({
  selector: 'app-gates',
  templateUrl: './gates.component.html',
  styleUrls: ['./gates.component.css'],
})
export class GatesComponent implements OnInit {
  @ViewChild('canvas', { static: true }) graphCanvas: ElementRef;

  graph: GateGraph;

  constructor(
    private readonly container: ElementRef,
    private readonly graphService: GraphService
  ) {}

  ngOnInit(): void {
    this.graph = this.graphService.createGateGraph(
      this.graphCanvas.nativeElement
    );

    this.graph.addRoot();
  }
}
