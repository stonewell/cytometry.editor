import mx from '../shared/mxgraph-loader';

import {
  mxCell,
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
import { Vertex, Cell, Graph, transactionEdit } from './graph-types';

import { GateService } from '../shared/gate.service';
import { Gate } from '../shared/gate-types';

export class GateGraph extends Graph {
  oldGetPreferredSizeForCell: any;
  highlight: any;

  mouseOverCell: any;

  rootGateVertex: any;

  constructor(
    readonly graph: mxGraph,
    readonly container: HTMLElement,
    private readonly gateService: GateService,
    readonly layout: any
  ) {
    super(graph, container);
  }

  initialize() {
    super.initialize();

    new mx.mxCellTracker(this.graph, '#00FF00');
    this.graph.addListener(mx.mxEvent.CLICK, this.onClick.bind(this));

    this.graph.panningHandler.useLeftButtonForPanning = true;

    mx.mxEvent.addMouseWheelListener(this.onMouseWheel.bind(this));

    // Installs a popupmenu handler using local function (see below).
    //this.graph.popupMenuHandler.factoryMethod = this.createPopupMenu.bind(this);

    // Fix for wrong preferred size
    this.oldGetPreferredSizeForCell = this.graph.getPreferredSizeForCell;
    this.graph.getPreferredSizeForCell =
      this.getPreferredSizeForCell.bind(this);

    // Sets the maximum text scale to 1
    this.graph.cellRenderer.getTextScale = function (state: any) {
      return Math.min(1, state.view.scale);
    };

    this.highlight = new mx.mxCellHighlight(this.graph, '#00ff00', 2);

    this.graph
      .getSelectionModel()
      .addListener(mx.mxEvent.CHANGE, this.onSelectionChange.bind(this));

    this.graph.addMouseListener({
      mouseDown: this.onMouseDown.bind(this),
      mouseMove: this.onMouseMove.bind(this),
      mouseUp: this.onMouseUp.bind(this),
    });
  }

  getPreferredSizeForCell(cell: any) {
    const result = this.oldGetPreferredSizeForCell.apply(this.graph, arguments);

    return result;
  }

  onMouseDown(sender: any, evt: any): void {}

  onMouseUp(sender: any, evt: any): void {}

  onMouseMove(sender: any, evt: any): void {
    const cell = evt.getCell();

    if (this.mouseOverCell !== cell) {
      if (this.mouseOverCell) {
        this.graph.removeCellOverlays(this.mouseOverCell);
      }

      if (!cell || cell.isEdge()) {
        this.mouseOverCell = undefined;
        return;
      }

      this.mouseOverCell = cell;

      if (this.mouseOverCell) {
        this.addOverlays(
          this.mouseOverCell,
          this.mouseOverCell.id !== 'treeRoot'
        );
      }
    }

    evt.consume();
  }

  onMouseWheel(evt: any, up: any) {}

  onClick(sender: any, evt: any) {
    const cell = evt.getProperty('cell');

    if (cell) {
      this.highlight.highlight(this.graph.view.getState(cell, true));
    }
  }

  // Function to create the entries in the popupmenu
  createPopupMenu(menu: any, cell: any, evt: any): any {
    if (cell != null) {
      if (this.model.isVertex(cell)) {
        menu.addItem(
          'Add child',
          './assets/img/overlays/check.png',
          this.addChild.bind(this, cell)
        );
      }

      if (cell.id != 'treeRoot' && this.model.isVertex(cell)) {
        menu.addItem(
          'Delete',
          './assets/img/delete.gif',
          this.deleteSubtree.bind(this, cell)
        );
      }

      menu.addSeparator();
    }

    menu.addItem(
      'Fit',
      './assets/img/zoom.gif',
      this.graph.fit.bind(this.graph)
    );

    menu.addItem(
      'Actual',
      './assets/img/zoomactual.gif',
      this.graph.zoomActual.bind(this.graph)
    );
  }

  @transactionEdit()
  addChild(cell: any) {
    const gate = this.gateService.addGate(cell['gate']);

    const vertex = this.addGateVertex(gate, cell);

    this.selectCell(vertex);

    return vertex;
  }

  @transactionEdit()
  deleteSubtree(cell: any) {
    const pGate = this.gateService.removeGate(cell['gate']);

    // Gets the subtree from cell downwards
    var cells: any[] = [];
    this.graph.traverse(cell, true, function (vertex: any) {
      cells.push(vertex);

      return true;
    });

    this.graph.removeCells(cells);

    var pVertex: any = null;
    this.graph.traverse(this.rootGateVertex, true, function (vertex: any) {
      if (vertex['gate'] === pGate) {
        pVertex = vertex;
        return false;
      }

      return true;
    });

    if (pVertex) {
      this.selectCell(pVertex);
    }
  }

  addOverlays(cell: any, addDeleteIcon: any) {
    var overlay = new mx.mxCellOverlay(
      new mx.mxImage('./assets/img/add.png', 15, 15),
      'Add Gate'
    );
    overlay.cursor = 'hand';
    overlay.align = mx.mxConstants.ALIGN_CENTER;
    overlay.addListener(
      mx.mxEvent.CLICK,
      this.onOverlayAddChild.bind(this, cell)
    );

    this.graph.addCellOverlay(cell, overlay);

    if (addDeleteIcon) {
      overlay = new mx.mxCellOverlay(
        new mx.mxImage('./assets/img/close.png', 15, 15),
        'Delete'
      );
      overlay.cursor = 'hand';
      overlay.offset = new mx.mxPoint(-2, 2);
      overlay.align = mx.mxConstants.ALIGN_RIGHT;
      overlay.verticalAlign = mx.mxConstants.ALIGN_TOP;
      overlay.addListener(
        mx.mxEvent.CLICK,
        this.onOverlayDelete.bind(this, cell)
      );

      this.graph.addCellOverlay(cell, overlay);
    }
  }

  onOverlayAddChild(cell: any, sender: any, evt: any) {
    this.addChild(cell);
  }

  onOverlayDelete(cell: any, sender: any, evt: any) {
    this.deleteSubtree(cell);
  }

  @transactionEdit()
  addRoot() {
    this.rootGateVertex = this.addGateToGraph(
      this.gateService.getRootGate(),
      null
    );

    this.rootGateVertex.geometry.x = 10;
    this.rootGateVertex.geometry.y = 10;

    this.selectCell(this.rootGateVertex);
    this.layout.adjustParents();
  }

  addGateToGraph(gate: Gate, parentVertex: any): any {
    //add gate it self
    const v = this.addGateVertex(
      gate,
      parentVertex,
      parentVertex ? '' : 'treeRoot'
    );

    for (const c of gate.children) {
      this.addGateToGraph(c, v);
    }

    return v;
  }

  updateVertexSize(v: any): void {
    const geometry = this.model.getGeometry(v);

    // Updates the geometry of the vertex with the
    // preferred size computed in the graph
    const size = this.graph.getPreferredSizeForCell(v);
    geometry.width = size.width;
    geometry.height = size.height;
  }

  addGateVertex(gate: Gate, parentVertex: any, vertexId: string = ''): any {
    const v = this.graph.insertVertex(
      this.root,
      vertexId,
      gate.name,
      10,
      10,
      0,
      0
    );

    this.updateVertexSize(v);

    // Adds the edge between the existing cell
    // and the new vertex and executes the
    // automatic layout on the parent
    if (parentVertex) {
      const edge = this.graph.insertEdge(this.root, null, '', parentVertex, v);

      // Configures the edge label "in-place" to reside
      // at the end of the edge (x = 1) and with an offset
      // of 20 pixels in negative, vertical direction.
      edge.geometry.x = 1;
      edge.geometry.y = 0;
      edge.geometry.offset = new mx.mxPoint(0, -20);
    }

    v['gate'] = gate;

    return v;
  }

  selectCell(cell: any) {
    this.graph.setSelectionCell(cell);
  }

  onSelectionChange(sender: any, evt: any) {
    const cells = this.graph.getSelectionCells();

    if (cells) {
      for (var i = 0; i < cells.length; i++) {
        if (cells[i]) {
          this.highlight.highlight(this.graph.view.getState(cells[i], true));
          this.gateService.setCurrentGate(cells[i]['gate']);
        }
      }
    }
  }

  @transactionEdit()
  updateCurrentGateLabel(): void {
    const cells = this.graph.getSelectionCells();

    if (cells) {
      for (var i = 0; i < cells.length; i++) {
        if (cells[i]) {
          this.model.setValue(cells[i], cells[i]['gate'].name);
          this.updateVertexSize(cells[i]);
          this.layout.execute(this.root);
        }
      }
    }
  }

  clear(): void {
    super.clear();
    this.layout.execute(this.root);
    this.layout.adjustParents();
    this.layout.moveTree = true;
    this.layout.visited = true;
  }
}
