import { Injectable } from '@angular/core';

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

import { EditorGraph } from './editor-graph-types';
import { GateGraph } from './gate-graph-types';
import { GateService } from './gate.service';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  constructor(private readonly gateService: GateService) {
    this.initialize();
  }

  initialize(): void {
    //setup mouse tolerance
    const mxGraphFireMouseEvent = mx.mxGraph.prototype.fireMouseEvent;
    mx.mxGraph.prototype.fireMouseEvent = function (evtName, me, sender) {
      // Checks if native hit detection did not return anything
      if (me.getState() == null) {
        // Updates the graph coordinates in the event since we need
        // them here. Storing them in the event means the overridden
        // method doesn't have to do this again.
        if (me.graphX == null || me.graphY == null) {
          const pt = mx.mxUtils.convertPoint(
            this.container,
            me.getX(),
            me.getY()
          );

          me.graphX = pt.x;
          me.graphY = pt.y;
        }

        const cell = this.getCellAt(me.graphX, me.graphY);

        if (this.getModel().isEdge(cell)) {
          me.state = this.view.getState(cell);

          if (me.state != null && me.state.shape != null) {
            this.container.style.cursor = me.state.shape.node.style.cursor;
          }
        }
      }

      if (me.state == null) {
        this.container.style.cursor = 'default';
      }

      mxGraphFireMouseEvent.apply(this, [evtName, me, sender]);
    };

    const mxGraphDblClick = mx.mxGraph.prototype.dblClick;
    mx.mxGraph.prototype.dblClick = function (evt, cell) {
      if (cell == null) {
        const pt = mx.mxUtils.convertPoint(
          this.container,
          mx.mxEvent.getClientX(evt),
          mx.mxEvent.getClientY(evt)
        );
        cell = this.getCellAt(pt.x, pt.y);
      }

      mxGraphDblClick.call(this, evt, cell);
    };
  }

  createEditorGraph(canvas: HTMLElement): EditorGraph {
    mx.mxEvent.disableContextMenu(canvas);

    const graph: mxGraph = new mx.mxGraph(canvas);

    //edge can not be disconnected
    graph.setAllowDanglingEdges(false);
    graph.setDisconnectOnMove(false);
    //edge can not be selected
    graph.isCellSelectable = function (cell) {
      return !cell.isEdge();
    };

    //style of vetex
    const style: StyleMap = {};

    style[mx.mxConstants.STYLE_SHAPE] = mx.mxConstants.SHAPE_RECTANGLE;
    style[mx.mxConstants.STYLE_OPACITY] = 100;
    style[mx.mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mx.mxConstants.STYLE_RESIZABLE] = '0';
    style[mx.mxConstants.STYLE_NOLABEL] = '1';
    graph.getStylesheet().putCellStyle('VERTEX', style);

    //style of edige, remote end arrow
    const styleEdge: StyleMap = {};
    styleEdge[mx.mxConstants.STYLE_ENDSIZE] = '0';
    styleEdge[mx.mxConstants.STYLE_NOLABEL] = '1';
    styleEdge[mx.mxConstants.STYLE_MOVABLE] = '0';
    graph.getStylesheet().putCellStyle('EDGE', styleEdge);

    graph.setTolerance(20);
    graph.centerZoom = true;
    graph.setPanning(false);
    graph.panningHandler.useLeftButtonForPanning = false;

    return new EditorGraph(graph, canvas, this.gateService);
  }

  createGateGraph(canvas: HTMLElement): GateGraph {
    mx.mxEvent.disableContextMenu(canvas);

    const graph: mxGraph = new mx.mxGraph(canvas);

    //edge can not be disconnected
    graph.setAllowDanglingEdges(false);
    graph.setDisconnectOnMove(false);
    graph.setCellsMovable(false);
    graph.setAutoSizeCells(true);

    //edge can not be selected
    graph.isCellSelectable = function (cell) {
      return !cell.isEdge();
    };

    // Disables tooltips on touch devices
    graph.setTooltips(!mx.mxClient.IS_TOUCH);

    mx.mxConstants.VERTEX_SELECTION_STROKEWIDTH = 0.1;

    // Set some stylesheet options for the visual appearance of vertices
    let style = graph.getStylesheet().getDefaultVertexStyle();
    style[mx.mxConstants.STYLE_SHAPE] = 'label';

    style[mx.mxConstants.STYLE_VERTICAL_ALIGN] = mx.mxConstants.ALIGN_MIDDLE;
    style[mx.mxConstants.STYLE_ALIGN] = mx.mxConstants.ALIGN_LEFT;
    style[mx.mxConstants.STYLE_SPACING_LEFT] = 4;

    style[mx.mxConstants.STYLE_RESIZABLE] = '0';

    style[mx.mxConstants.STYLE_GRADIENTCOLOR] = '#7d85df';
    style[mx.mxConstants.STYLE_STROKECOLOR] = '#5d65df';
    style[mx.mxConstants.STYLE_FILLCOLOR] = '#adc5ff';

    style[mx.mxConstants.STYLE_FONTCOLOR] = '#1d258f';
    style[mx.mxConstants.STYLE_FONTFAMILY] = 'Verdana';
    style[mx.mxConstants.STYLE_FONTSIZE] = '12';
    style[mx.mxConstants.STYLE_FONTSTYLE] = '1';

    style[mx.mxConstants.STYLE_SHADOW] = '1';
    style[mx.mxConstants.STYLE_ROUNDED] = '1';
    style[mx.mxConstants.STYLE_GLASS] = '1';

    // Sets the default style for edges
    style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mx.mxConstants.STYLE_ROUNDED] = true;
    style[mx.mxConstants.STYLE_STROKEWIDTH] = 3;
    style[mx.mxConstants.STYLE_EXIT_X] = 1.0; // center
    style[mx.mxConstants.STYLE_EXIT_Y] = 0.5; // bottom
    style[mx.mxConstants.STYLE_EXIT_PERIMETER] = 0; // disabled
    style[mx.mxConstants.STYLE_ENTRY_X] = 0; // center
    style[mx.mxConstants.STYLE_ENTRY_Y] = 0.5; // top
    style[mx.mxConstants.STYLE_ENTRY_PERIMETER] = 0; // disabled

    // Disable the following for straight lines
    style[mx.mxConstants.STYLE_EDGE] = mx.mxEdgeStyle.SideToSide;

    // Stops editing on enter or escape keypress
    const keyHandler = new mx.mxKeyHandler(graph);

    // Enables automatic layout on the graph and installs
    // a tree layout for all groups who's children are
    // being changed, added or removed.
    const layout = new mx.mxCompactTreeLayout(graph, true, false);
    layout.useBoundingBox = false;
    layout.edgeRouting = false;
    layout.levelDistance = 60;
    layout.nodeDistance = 16;

    // Allows the layout to move cells even though cells
    // aren't movable in the graph
    layout.isVertexMovable = function (cell) {
      return true;
    };

    const layoutMgr = new mx.mxLayoutManager(graph);

    layoutMgr.getLayout = function (cell, evt) {
      if (cell.getChildCount() > 0) {
        return layout;
      }

      return null;
    };

    graph.setTolerance(20);
    graph.centerZoom = true;
    graph.setPanning(true);
    graph.panningHandler.useLeftButtonForPanning = true;

    return new GateGraph(graph, canvas, this.gateService, layout);
  }
}
