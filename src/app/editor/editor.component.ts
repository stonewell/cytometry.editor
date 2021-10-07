import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';

import mx from '../shared/mxgraph-loader';
import { mxConstants, mxStylesheet, mxGraph, mxGraphModel, StyleMap } from 'mxgraph';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('canvas', {'static': true}) graphCanvas: ElementRef;

  constructor(private readonly container: ElementRef) { }

  ngOnInit(): void {
    const graph: mxGraph = new mx.mxGraph(this.graphCanvas.nativeElement);
    const model: mxGraphModel = graph.getModel();

    //edge can not be disconnected
    graph.setAllowDanglingEdges(false);
    graph.setDisconnectOnMove(false);
    //edge can not be selected
    graph.isCellSelectable = function(cell)
    {
      return !cell.isEdge();
    };


    //style of vetex
    const style: StyleMap = {
    };

    style[mx.mxConstants.STYLE_SHAPE] = mx.mxConstants.SHAPE_RECTANGLE;
    style[mx.mxConstants.STYLE_OPACITY] = 100;
    style[mx.mxConstants.STYLE_FONTCOLOR]= '#774400';
    style[mx.mxConstants.STYLE_RESIZABLE] = '0';
    style[mx.mxConstants.STYLE_NOLABEL] = '1';
    graph.getStylesheet().putCellStyle('VERTEX', style);

    //style of edige, remote end arrow
    const styleEdge: StyleMap = {
    };
    styleEdge[mx.mxConstants.STYLE_ENDSIZE] = '0';
    styleEdge[mx.mxConstants.STYLE_NOLABEL] = '1';
    styleEdge[mx.mxConstants.STYLE_MOVABLE] = '0';
    graph.getStylesheet().putCellStyle('EDGE', styleEdge);

    model.beginUpdate();
    try {
      const v1 = graph.insertVertex(graph.getDefaultParent(), '', '', 0, 0, 5, 5, 'VERTEX;whiteSpace=wrap;html=1;');
      const v2 = graph.insertVertex(graph.getDefaultParent(), '', '', 42, 42, 5, 5, 'VERTEX;whiteSpace=wrap;html=1;');
      graph.insertEdge(graph.getDefaultParent(), null, '', v1, v2, 'EDGE');
    } finally {
      model.endUpdate();
    }
  }
}
