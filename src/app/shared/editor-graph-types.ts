import mx from '../shared/mxgraph-loader';

import {
  mxConstants,
  mxStylesheet,
  mxGraph,
  mxGraphModel,
  StyleMap,
  mxCellTracker,
  mxUndoManager,
  mxOutline,
} from 'mxgraph';
import { isInside } from './polygon';

const VERTEX_SIZE: number = 5;

export class EditorVertex {
  native: any;

  g: EditorGraph;

  e1?: EditorEdge;
  e2?: EditorEdge;

  connect(e: EditorEdge) {
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

  disconnect(e: EditorEdge): void {
    if (this.e1 === e) {
      this.e1 = undefined;
    } else if (this.e2 === e) {
      this.e2 = undefined;
    }
  }

  getState() {
    return this.g.graph.view.getState(this.native);
  }
}

export class EditorEdge {
  native: any;

  g: EditorGraph;

  v1: EditorVertex;
  v2: EditorVertex;

  split(x: number, y: number) {
    this.g.splitEdge(x, y, this);
  }

  removeFromGraph(): void {
    this.g.remove([this]);

    [this.v1, this.v2].forEach((v) => v.disconnect(this));
  }
}

function transactionEdit() {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const childFunction = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      this.model.beginUpdate();
      try {
        try {
          return childFunction.apply(this, args);
        } finally {
          this.model.endUpdate();
        }
      } catch (e) {
        this.undoManager.undo();
        throw e;
      }
    };
    return descriptor;
  };
}

export class EditorGraph {
  model: mxGraphModel;

  vertexes: EditorVertex[] = [];
  edges: EditorEdge[] = [];
  undoManager: mxUndoManager;

  root: any;

  isMouseDown: boolean = false;
  lastMousePt: any;

  originPanningTrigger: any;

  constructor(
    readonly graph: mxGraph,
    readonly outline: mxOutline,
    readonly container: HTMLElement
  ) {
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
      this.onDoubleClick.bind(this)
    );
    this.graph.addListener(mx.mxEvent.CLICK, this.onClick.bind(this));

    this.graph.addMouseListener({
      mouseDown: this.onMouseDown.bind(this),
      mouseMove: this.onMouseMove.bind(this),
      mouseUp: this.onMouseUp.bind(this),
    });

    this.graph.setBackgroundImage(
      new mx.mxImage('./assets/img/image.png', 900, 900)
    );
    this.originPanningTrigger = this.graph.panningHandler.isPanningTrigger;
    this.graph.panningHandler.isPanningTrigger =
      this.isPanningTrigger.bind(this);

    mx.mxEvent.addMouseWheelListener(this.onMouseWheel.bind(this));
    this.root = this.graph.getDefaultParent();
  }

  isPanningTrigger(me: any): boolean {
    if (this.mouseDownInGraph(me)) {
      return false;
    }

    return true;
  }

  moveAll(pt: any) {
    this.graph.moveCells(
      this.graph.getChildCells(this.root, true, true),
      (pt.x - this.lastMousePt.x) / this.graph.view.scale,
      (pt.y - this.lastMousePt.y) / this.graph.view.scale,
      false
    );
  }

  getPoint(evt: any) {
    return new mx.mxPoint(evt.getGraphX(), evt.getGraphY());
  }

  onMouseWheel(evt: any, up: any) {
    if (up) {
      this.graph.zoomIn();
    } else {
      this.graph.zoomOut();
    }
  }

  onMouseDown(sender: any, evt: any): void {
    if (this.mouseDownInGraph(evt)) {
      this.isMouseDown = true;

      this.lastMousePt = this.getPoint(evt);
      evt.consume();
    }
  }

  onMouseUp(sender: any, evt: any): void {
    if (this.isMouseDown) {
      const pt = this.getPoint(evt);

      this.moveAll(pt);
      evt.consume();
    }
    this.isMouseDown = false;
  }

  onMouseMove(sender: any, evt: any): void {
    if (!this.isMouseDown) return;

    const pt = this.getPoint(evt);

    this.moveAll(pt);

    this.lastMousePt = pt;
    evt.consume();
  }

  onUndoableEdit(sender: any, evt: any): void {
    this.undoManager.undoableEditHappened(evt.getProperty('edit'));
  }

  onDoubleClick(sender: any, evt: any) {
    const cell = evt.getProperty('cell');
    const me = evt.getProperty('event');

    const pt = mx.mxUtils.convertPoint(
      this.container,
      mx.mxEvent.getClientX(me),
      mx.mxEvent.getClientY(me)
    );

    const pX = pt.x / this.graph.view.scale - this.graph.view.translate.x;
    const pY = pt.y / this.graph.view.scale - this.graph.view.translate.y;

    if (cell && cell.isEdge()) {
      cell['EDGE'].split(pX, pY);
    }
    evt.consume();
  }

  onClick(sender: any, evt: any) {}

  @transactionEdit()
  remove(cells: any): void {
    this.graph.removeCells(cells.map((c: any) => c.native));

    for (var i = 0; i < cells.length; i++) {
      [this.vertexes, this.edges].forEach((v) => {
        const j = v.indexOf(cells[i]);

        if (j >= 0) {
          v.splice(j, 1);
        }
      });
    }
  }

  @transactionEdit()
  addVertex(x: any, y: any): EditorVertex {
    return this.doAddVertex(x, y);
  }

  doAddVertex(x: any, y: any): EditorVertex {
    const v = new EditorVertex();

    v.native = this.graph.insertVertex(
      this.root,
      '',
      '',
      x,
      y,
      VERTEX_SIZE,
      VERTEX_SIZE,
      'VERTEX;whiteSpace=wrap;html=1;'
    );

    v.native['VERTEX'] = v;
    v.g = this;

    this.vertexes.push(v);

    return v;
  }

  @transactionEdit()
  addEdge(v1: EditorVertex, v2: EditorVertex): EditorEdge {
    return this.doAddEdge(v1, v2);
  }

  doAddEdge(v1: EditorVertex, v2: EditorVertex): EditorEdge {
    const e = new EditorEdge();
    e.v1 = v1;
    e.v2 = v2;
    e.native = this.graph.insertEdge(
      this.root,
      null,
      '',
      v1.native,
      v2.native,
      'EDGE'
    );

    e.native['EDGE'] = e;
    e.g = this;

    v1.connect(e);
    v2.connect(e);

    this.edges.push(e);

    return e;
  }

  @transactionEdit()
  splitEdge(x: number, y: number, e: EditorEdge): EditorVertex {
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

  mouseDownInGraph(evt: any): boolean {
    if (evt.getCell() && !evt.getCell().isEdge()) {
      return false;
    }

    return isInside(this.vertexes[0], evt.getGraphX(), evt.getGraphY());
  }
}