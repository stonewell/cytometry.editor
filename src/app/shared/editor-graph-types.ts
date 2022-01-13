import mx from '../shared/mxgraph-loader';

import {
  mxConstants,
  mxStylesheet,
  mxGraph,
  mxGraphModel,
  StyleMap,
  mxCellTracker,
  mxUndoManager,
} from 'mxgraph';

import { isInside, getBoundBox, getVertexPolygon, vertexToPoint } from './polygon';
import { Vertex, Cell, Graph, transactionEdit } from './graph-types';
import { GateService } from './gate.service';

const VERTEX_SIZE: number = 5;

export class EditorVertex extends Vertex {
  e1?: EditorEdge;
  e2?: EditorEdge;

  constructor(readonly native: any, readonly g: EditorGraph) {
    super(native, g);
  }

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
}

export class EditorEdge extends Cell {
  v1: EditorVertex;
  v2: EditorVertex;

  constructor(readonly native: any, readonly g: EditorGraph) {
    super(native, g);
  }

  split(x: number, y: number) {
    this.g.splitEdge(x, y, this);
  }

  removeFromGraph(): void {
    this.g.remove([this]);

    [this.v1, this.v2].forEach((v) => v.disconnect(this));
  }
}

export class EditorGraph extends Graph {
  vertexes: EditorVertex[] = [];
  edges: EditorEdge[] = [];

  isMouseDown: boolean = false;
  isMoving: boolean = false;
  isCellMoved: boolean = false;
  lastMousePt: any;
  isRebuildingRectangle: boolean = false;

  originPanningTrigger: any;

  constructor(
    readonly graph: mxGraph,
    readonly container: HTMLElement,
    readonly gateService: GateService
  ) {
    super(graph, container);
  }

  initialize() {
    super.initialize();

    this.graph.addListener(
      mx.mxEvent.DOUBLE_CLICK,
      this.onDoubleClick.bind(this)
    );
    this.graph.addListener(mx.mxEvent.CLICK, this.onClick.bind(this));
    this.graph.addListener(
      mx.mxEvent.CELLS_MOVED,
      this.onCellsMoved.bind(this)
    );

    this.graph.addMouseListener({
      mouseDown: this.onMouseDown.bind(this),
      mouseMove: this.onMouseMove.bind(this),
      mouseUp: this.onMouseUp.bind(this),
    });

    // limit cells moving boundary
    this.graph.resizeContainer = false;
    this.graph.ignoreScrollbars = true;
    this.graph.autoScroll = false;
    this.graph.autoExtend = false;
    this.graph.maximumGraphBounds = new mx.mxRectangle(
      0,
      0,
      this.container.offsetWidth,
      this.container.offsetHeight
    );

    this.originPanningTrigger = this.graph.panningHandler.isPanningTrigger;
    this.graph.panningHandler.isPanningTrigger =
      this.isPanningTrigger.bind(this);

    mx.mxEvent.addMouseWheelListener(this.onMouseWheel.bind(this));

    this.model.addListener(mx.mxEvent.NOTIFY, this.onModelNotify.bind(this));
  }

  isPanningTrigger(me: any): boolean {
    if (this.mouseDownInGraph(me)) {
      return false;
    }

    return true;
  }

  onMouseWheel(evt: any, up: any) {}

  onMouseDown(sender: any, evt: any): void {
    this.isMouseDown = true;
    this.isCellMoved = false;

    if (this.mouseDownInGraph(evt)) {
      this.isMoving = true;

      this.lastMousePt = this.getPoint(evt);
      evt.consume();
    }
  }

  onMouseUp(sender: any, evt: any): void {
    if (this.isMoving) {
      const pt = this.getPoint(evt);

      this.moveAll(pt);
      evt.consume();
    }

    if (this.isMoving || this.isCellMoved) {
      this.gateService.notifyCurrentGateUpdated('verties-moved');
    }

    this.isMoving = false;
    this.isMouseDown = false;
    this.isCellMoved = false;
  }

  onMouseMove(sender: any, evt: any): void {
    if (!this.isMoving) return;

    const pt = this.getPoint(evt);

    this.moveAll(pt);

    this.lastMousePt = pt;
    evt.consume();
  }

  onDoubleClick(sender: any, evt: any) {
    if (this.gateService.isDAFiGating()) {
      console.log('only rectangle gate for DAFi gating');
      return;
    }

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

  onCellsMoved(sender: any, evt: any) {
    this.isCellMoved = !this.isMoving;

    if (this.isCellMoved && this.gateService.isDAFiGating()) {
      const cell = evt.getProperty('cells')[0];
      const dx = evt.getProperty('dx');
      const dy = evt.getProperty('dy');
      this.rebuildRectangle(cell, dx, dy);
    }
  }

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
    const native = this.graph.insertVertex(
      this.root,
      '',
      '',
      x,
      y,
      VERTEX_SIZE,
      VERTEX_SIZE,
      'VERTEX;whiteSpace=wrap;html=1;'
    );

    const v = new EditorVertex(native, this);
    v.native['VERTEX'] = v;

    this.vertexes.push(v);

    return v;
  }

  @transactionEdit()
  addEdge(v1: EditorVertex, v2: EditorVertex): EditorEdge {
    return this.doAddEdge(v1, v2);
  }

  doAddEdge(v1: EditorVertex, v2: EditorVertex): EditorEdge {
    const native = this.graph.insertEdge(
      this.root,
      null,
      '',
      v1.native,
      v2.native,
      'EDGE'
    );

    const e = new EditorEdge(native, this);
    e.v1 = v1;
    e.v2 = v2;

    e.native['EDGE'] = e;

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

  canMoveAll(dx: number, dy: number): boolean {
    const box = getBoundBox(this.vertexes[0]);

    const left = box.x + dx;
    const top = box.y + dy;
    const right = left + box.width;
    const bottom = top + box.height;

    const gBox = this.graph.maximumGraphBounds;
    const plotMargin = this.gateService.getGatePlotMargin();

    const gleft = gBox.x + VERTEX_SIZE + gBox.width * plotMargin.left;
    const gtop = gBox.y + VERTEX_SIZE + gBox.height * plotMargin.top;
    const gright =
      gleft +
      gBox.width -
      VERTEX_SIZE * 2 -
      gBox.width * (plotMargin.left + plotMargin.right);
    const gbottom =
      gtop +
      gBox.height -
      VERTEX_SIZE * 2 -
      gBox.height * (plotMargin.top + plotMargin.bottom);

    return !(left < gleft || top < gtop || right > gright || bottom > gbottom);
  }

  moveAll(pt: any) {
    const dx = (pt.x - this.lastMousePt.x) / this.graph.view.scale;
    const dy = (pt.y - this.lastMousePt.y) / this.graph.view.scale;

    if (!this.canMoveAll(dx, dy)) {
      return;
    }

    this.graph.moveCells(
      this.graph.getChildCells(this.root, true, true),
      dx,
      dy,
      false
    );
  }

  getPoint(evt: any) {
    return new mx.mxPoint(evt.getGraphX(), evt.getGraphY());
  }

  pointToPlotPoint(p: any) {
    const gBox = this.graph.maximumGraphBounds;
    const plotMargin = this.gateService.getGatePlotMargin();

    const plotLeft = gBox.x + gBox.width * plotMargin.left;
    const plotTop = gBox.y + gBox.height * plotMargin.top;

    const plotWidth = gBox.width * (1 - plotMargin.left - plotMargin.right);
    const plotHeight = gBox.height * (1 - plotMargin.top - plotMargin.bottom);

    return {
      x: (p.x - plotLeft) / plotWidth,
      y: (plotHeight - p.y + plotTop) / plotHeight,
    };
  }

  plotPointToPoint(p: any) {
    const gBox = this.graph.maximumGraphBounds;
    const plotMargin = this.gateService.getGatePlotMargin();

    const plotLeft = gBox.x + gBox.width * plotMargin.left;
    const plotTop = gBox.y + gBox.height * plotMargin.top;

    const plotWidth = gBox.width * (1 - plotMargin.left - plotMargin.right);
    const plotHeight = gBox.height * (1 - plotMargin.top - plotMargin.bottom);

    return {
      x: p.x * plotWidth + plotLeft,
      y: (1 - p.y) * plotHeight + plotTop,
    };
  }

  onModelNotify(sender: any, evt: any) {
    if (this.vertexes?.length > 0) {
      const currentGate = this.gateService.getCurrentGate();

      currentGate.points = getVertexPolygon(this.vertexes[0]).map((p) => {
        return this.pointToPlotPoint(p);
      });

      this.gateService.notifyCurrentGateUpdated('points');
    }
  }

  clear(): void {
    this.vertexes = [];
    this.edges = [];

    this.isMouseDown = false;
    this.isMoving = false;
    this.isCellMoved = false;

    this.lastMousePt = undefined;
    this.isRebuildingRectangle = false;

    super.clear();
  }

  rebuildRectangle(cell: any, dx: number, dy: number): void {
    if (this.isRebuildingRectangle)
      return;

    this.isRebuildingRectangle = true;

    const v = cell['VERTEX'];

    //find the oppsite vertex
    const vNext = v.e1.v1 === v ? v.e1.v2 : v.e1.v1;
    const vNext2 = v.e2.v1 === v ? v.e2.v2 : v.e2.v1;

    let v2 = undefined;

    if (vNext.e1.v1 === v || vNext.e1.v2 === v) {
      if (vNext.e2.v1 === vNext) {
        v2 = vNext.e2.v2;
      } else {
        v2 = vNext.e2.v1;
      }
    } else {
      if (vNext.e1.v1 === vNext) {
        v2 = vNext.e1.v2;
      } else {
        v2 = vNext.e1.v1;
      }
    }

    const pt = vertexToPoint(v);
    pt.x += dx;
    pt.y += dy;

    const pt2 = vertexToPoint(v2);

    this.moveVertexTo(vNext, {x: pt2.x, y: pt.y});
    this.moveVertexTo(vNext2, {x: pt.x, y: pt2.y});

    this.isRebuildingRectangle = false;
  }

  @transactionEdit()
  moveVertexTo(v: any, pt: any): void {
    const ptOld = vertexToPoint(v);

    this.graph.moveCells([v.native],
                         pt.x - ptOld.x,
                         pt.y - ptOld.y,
                         false);
  }
}
