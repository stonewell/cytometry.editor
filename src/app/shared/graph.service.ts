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
  mxOutline,
} from 'mxgraph';
import { Graph } from './graph-types';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  constructor() {
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

  createGraph(canvas: HTMLElement, outline: HTMLElement): Graph {
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
    style[mx.mxConstants.STYLE_FONTCOLOR] = '#774400';
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
    graph.setPanning(true);
    graph.panningHandler.useLeftButtonForPanning = true;

    const outl = new mx.mxOutline(graph, outline);
    outl.updateOnPan = true;
    outl.sizerImage = new mx.mxImage('./assets/img/image.png', 17, 17);

    return new Graph(graph, outl, canvas);
  }
}
