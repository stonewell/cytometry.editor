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

export class GateGraph extends Graph {
  oldGetPreferredSizeForCell: any;
  highlight: any;

  mouseOverCell: any;

  constructor(readonly graph: mxGraph, readonly container: HTMLElement) {
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

    this.graph.getSelectionModel().addListener(mx.mxEvent.CHANGE,
                                               this.onSelectionChange.bind(this));

    this.graph.addMouseListener({
      mouseMove: this.onMouseMove.bind(this),
    });
  }

  getPreferredSizeForCell(cell: any) {
    const result = this.oldGetPreferredSizeForCell.apply(this.graph, arguments);

    return result;
  }

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
        this.addOverlays(this.mouseOverCell,
                         this.mouseOverCell.id !== 'treeRoot');
      }
    }

    evt.consume();
  }

  onMouseWheel(evt: any, up: any) {
    if (up) {
      this.graph.zoomIn();
    } else {
      this.graph.zoomOut();
    }
  }

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
    const vertex = this.graph.insertVertex(
      this.root,
      null,
      'New Gate',
      0,
      0,
      0,
      0
    );
    const geometry = this.model.getGeometry(vertex);

    // Updates the geometry of the vertex with the
    // preferred size computed in the graph
    const size = this.graph.getPreferredSizeForCell(vertex);
    geometry.width = size.width;
    geometry.height = size.height;

    // Adds the edge between the existing cell
    // and the new vertex and executes the
    // automatic layout on the parent
    const edge = this.graph.insertEdge(this.root, null, '', cell, vertex);

    // Configures the edge label "in-place" to reside
    // at the end of the edge (x = 1) and with an offset
    // of 20 pixels in negative, vertical direction.
    edge.geometry.x = 1;
    edge.geometry.y = 0;
    edge.geometry.offset = new mx.mxPoint(0, -20);

    this.selectCell(vertex);

    return vertex;
  }

  @transactionEdit()
  deleteSubtree(cell: any) {
    // Gets the subtree from cell downwards
    var cells: any[] = [];
    this.graph.traverse(cell, true, function (vertex: any) {
      cells.push(vertex);

      return true;
    });

    this.graph.removeCells(cells);
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
    const root = this.graph.insertVertex(
      this.root,
      'treeRoot',
      'New Gate',
      5,
      5,
      40,
      20
    );
    this.graph.updateCellSize(root);

    this.selectCell(root);
  }

  selectCell(cell: any) {
    this.graph.setSelectionCell(cell);
  }

  onSelectionChange(sender: any, evt: any)
  {
    this.graph.clearCellOverlays(this.root);

    const cells = this.graph.getSelectionCells();

    if (cells) {
      for (var i = 0; i < cells.length; i++)
      {
        if (cells[i]) {
          this.highlight.highlight(this.graph.view.getState(cells[i], true));
        }
      }
    }
  }
}
