import mx from '../shared/mxgraph-loader';
import { mxConstants, mxStylesheet, mxGraph, mxGraphModel, StyleMap, mxCellTracker, mxUndoManager } from 'mxgraph';
import { isInside } from './polygon';

const VERTEX_SIZE: number = 5;

export class Vertex {
  native: any;

  g: Graph;

  e1?: Edge;
  e2?: Edge;

  connect(e: Edge) {
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

  disconnect(e: Edge): void {
    if (this.e1 === e) {
      this.e1 = undefined;
    } else if (this.e2 === e) {
      this.e2 = undefined;
    }
  }
}

export class Edge {
  native: any;

  g: Graph;

  v1: Vertex;
  v2: Vertex;

  split(x: number, y: number) {
    this.g.splitEdge(x, y, this);
  }

  removeFromGraph(): void {
    this.g.remove([this]);

    [this.v1, this.v2].forEach(v => v.disconnect(this));
  }
}

function transactionEdit() {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const childFunction = descriptor.value;
    descriptor.value = function(this: any, ...args: any[]) {
      this.model.beginUpdate();
      try{
        try {
          return childFunction.apply(this, args);
        } finally {
          this.model.endUpdate();
        }
      } catch(e) {
        this.undoManager.undo();
        throw e;
      }
    };
    return descriptor;
  };
}

export class Graph {
  private model: mxGraphModel;

  vertexes: Vertex[] = [];
  edges: Edge[] = [];
  undoManager: mxUndoManager;

  private root: any;

  constructor(private readonly graph: mxGraph,
              private readonly container: HTMLElement) {
    this.model = graph.getModel();

    this.initialize();
  }

  initialize() {
    this.undoManager = new mx.mxUndoManager();
		const listener = this.onUndoableEdit.bind(this);

    this.graph.getModel().addListener(mx.mxEvent.UNDO, listener);
		this.graph.getView().addListener(mx.mxEvent.UNDO, listener);

    this.graph.addListener(
      mx.mxEvent.DOUBLE_CLICK,
      this.onDoubleClick.bind(this));
    this.graph.addListener(
      mx.mxEvent.CLICK,
      this.onClick.bind(this));

    this.root = this.graph.getDefaultParent();
  }

  onUndoableEdit(sender: any, evt: any): void {
		this.undoManager.undoableEditHappened(evt.getProperty('edit'));
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

  onClick(sender: any, evt: any)
	{
    const me = evt.getProperty('event');
    const pt = mx.mxUtils.convertPoint(this.container,
									                     mx.mxEvent.getClientX(me),
                                       mx.mxEvent.getClientY(me));
    if (isInside(this.vertexes[0], pt.x, pt.y)) {
      console.log('inside');
    } else {
      console.log('outside');
    }

		evt.consume();
	};

  @transactionEdit()
  remove(cells: any): void {
    this.graph.removeCells(cells.map((c: any) => c.native));

    for(var i=0; i < cells.length; i++) {
      [this.vertexes, this.edges].forEach(v => {
        const j = v.indexOf(cells[i]);

        if (j >= 0) {
          v.splice(j, 1);
        }
      });
    }
  }

  @transactionEdit()
  addVertex(x: any, y: any): Vertex {
    return this.doAddVertex(x, y);
  }

  doAddVertex(x: any, y: any): Vertex {
    const v = new Vertex();

    v.native = this.graph.insertVertex(
      this.root,
      '', '',
      x, y,
      VERTEX_SIZE, VERTEX_SIZE,
      'VERTEX;whiteSpace=wrap;html=1;');

    v.native['VERTEX'] = v;
    v.g = this;

    this.vertexes.push(v);

    return v;
  }

  @transactionEdit()
  addEdge(v1: Vertex, v2: Vertex): Edge {
    return this.doAddEdge(v1, v2);
  }

  doAddEdge(v1: Vertex, v2: Vertex): Edge {
    const e = new Edge();
    e.v1 = v1;
    e.v2 = v2;
    e.native = this.graph.insertEdge(this.root, null, '',
                                     v1.native, v2.native, 'EDGE');

    e.native['EDGE'] = e;
    e.g = this;

    v1.connect(e);
    v2.connect(e);

    this.edges.push(e);

    return e;
  }

  @transactionEdit()
  splitEdge(x: number, y:number, e: Edge): Vertex {
    const v1 = e.v1;
    const v2 = e.v2;

    if (v1.fullConnected() || v2.fullConnected()) {
      e.removeFromGraph();
    }

    const v = this.doAddVertex(x, y);
    this.doAddEdge(v, v1);
    this.doAddEdge(v, v2);
    return v;
  }
}
