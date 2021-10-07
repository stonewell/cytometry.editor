import { Injectable } from '@angular/core';
import mx from '../shared/mxgraph-loader';
import { mxConstants, mxStylesheet, mxGraph, mxGraphModel, StyleMap, mxCellTracker } from 'mxgraph';

const VERTEX_SIZE: number = 5;

export class MXVertex {
  g: MXGraph;
  v: any;
  e1?: MXEdge;
  e2?: MXEdge;

  connect(e: MXEdge) {
    if (!this.e1) {
      this.e1 = e;
    } else if (!this.e2) {
      this.e2 = e;
    } else {
      throw 'unable to connect, vertex already has 2 edges';
    }
  }

  fullConnected(): boolean {
    return !!this.e1 && !!this.e2;
  }

  disconnect(e: MXEdge): void {
    if (this.e1 === e) {
      this.e1 = undefined;
    } else if (this.e2 === e) {
      this.e2 = undefined;
    }
  }
}

export class MXEdge {
  g: MXGraph;
  e: any;
  v1: MXVertex;
  v2: MXVertex;

  split(x: number, y: number) {
    this.g.splitEdge(x, y, this);
  }

  removeFromGraph(): void {
    this.g.remove([this.e]);

    [this.v1, this.v2].map(v => v.disconnect(this));
  }
}

export class MXGraph {
  private model: mxGraphModel;

  vertexes: MXVertex[] = [];
  edges: MXEdge[] = [];

  constructor(private readonly graph: mxGraph,
              private readonly container: HTMLElement) {
    this.model = graph.getModel();

    this.initialize();
  }

  initialize() {
    this.graph.addListener(
      mx.mxEvent.DOUBLE_CLICK,
      this.onDoubleClick.bind(this));
  }

  remove(cells: any): void {
    this.graph.removeCells(cells);

    for(var i=0; i < cells.length; i++) {
      [this.vertexes, this.edges].map(v => {
        for (var j=0; j < v.length; j++) {
          if (v[j] === cells[i]) {
            v.splice(j, 1);
            break;
          }
        }
      });
    }
  }

  onDoubleClick(sender: any, evt: any)
	{
		const cell = evt.getProperty('cell');
    const me = evt.getProperty('event');
    const pt = mx.mxUtils.convertPoint(this.container,
									                     mx.mxEvent.getClientX(me),
                                       mx.mxEvent.getClientY(me));

    if (cell && cell.isEdge()) {
      cell['EDGE'].split(pt.x, pt.y);
    }
		evt.consume();
	};

  addVertex(x: any, y: any): MXVertex {
    this.model.beginUpdate();
    try {
      return this.doAddVertex(x, y);
    } finally {
      this.model.endUpdate();
    }
  }

  doAddVertex(x: any, y: any): MXVertex {
      const v = new MXVertex();

      v.v = this.graph.insertVertex(
        this.graph.getDefaultParent(),
        '', '',
        x, y,
        VERTEX_SIZE, VERTEX_SIZE,
        'VERTEX;whiteSpace=wrap;html=1;');

      v.v['VERTEX'] = v;
      v.g = this;

      this.vertexes.push(v);

      return v;
  }

  addEdge(v1: MXVertex, v2: MXVertex): MXEdge {
    this.model.beginUpdate();
    try {
      return this.doAddEdge(v1, v2);
    } finally {
      this.model.endUpdate();
    }
  }

  doAddEdge(v1: MXVertex, v2: MXVertex): MXEdge {
      const e = new MXEdge();
      e.v1 = v1;
      e.v2 = v2;
      e.e = this.graph.insertEdge(this.graph.getDefaultParent(), null, '', v1.v, v2.v, 'EDGE');

      e.e['EDGE'] = e;
      e.g = this;

      v1.connect(e);
      v2.connect(e);

      this.edges.push(e);

      return e;
  }

  splitEdge(x: number, y:number, e: MXEdge): MXVertex {
    this.model.beginUpdate();
    try {
      const v1 = e.v1;
      const v2 = e.v2;

      if (v1.fullConnected() || v2.fullConnected()) {
        e.removeFromGraph();
      }

      const v = this.doAddVertex(x, y);
      this.doAddEdge(v, v1);
      this.doAddEdge(v, v2);
      return v;
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
    mx.mxEvent.disableContextMenu(canvas);

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

    return new MXGraph(graph, canvas);
  }
}
