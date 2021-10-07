import { Injectable } from '@angular/core';
import mx from '../shared/mxgraph-loader';
import { mxConstants, mxStylesheet, mxGraph, mxGraphModel, StyleMap } from 'mxgraph';

const VERTEX_SIZE: number = 5;

export class MXVertex {
  v: any;
  e1: MXEdge;
  e2: MXEdge;
}

export class MXEdge {
  e: any;
  v1: MXVertex;
  v2: MXVertex;
}

export class MXGraph {
  private model: mxGraphModel;

  constructor(private readonly graph: mxGraph) {
    this.model = graph.getModel();
  }

  addVertex(x: any, y: any): MXVertex {
    this.model.beginUpdate();
    try {
      const v = new MXVertex();

      v.v = this.graph.insertVertex(
        this.graph.getDefaultParent(),
        '', '',
        x, y,
        VERTEX_SIZE, VERTEX_SIZE,
        'VERTEX;whiteSpace=wrap;html=1;');
      return v;
    } finally {
      this.model.endUpdate();
    }
  }

  addEdge(v1: MXVertex, v2: MXVertex): MXEdge {
    this.model.beginUpdate();
    try {
      const e = new MXEdge();
      e.v1 = v1;
      e.v2 = v2;
      e.e = this.graph.insertEdge(this.graph.getDefaultParent(), null, '', v1.v, v2.v, 'EDGE');

      return e;
    } finally {
      this.model.endUpdate();
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class MXGraphService {

  constructor() {
  }

  createMXGraph(canvas: HTMLElement): MXGraph {
    const graph: mxGraph = new mx.mxGraph(canvas);

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

    return new MXGraph(graph);
  }
}
