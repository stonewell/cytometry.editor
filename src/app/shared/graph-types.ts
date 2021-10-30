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

export class Cell {
  constructor(readonly native: any, readonly g: Graph) {}
}

export class Vertex extends Cell {
  constructor(readonly native: any, readonly g: Graph) {
    super(native, g);
  }

  getState() {
    return this.g.graph.view.getState(this.native);
  }
}

export function transactionEdit() {
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

export class Graph {
  model: mxGraphModel;

  undoManager: mxUndoManager;

  root: any;

  constructor(readonly graph: mxGraph, readonly container: HTMLElement) {
    this.model = graph.getModel();

    this.initialize();
  }

  initialize() {
    this.undoManager = new mx.mxUndoManager();
    const listener = this.onUndoableEdit.bind(this);

    this.graph.getModel().addListener(mx.mxEvent.UNDO, listener);
    this.graph.getView().addListener(mx.mxEvent.UNDO, listener);

    this.root = this.graph.getDefaultParent();
  }

  onUndoableEdit(sender: any, evt: any): void {
    this.undoManager.undoableEditHappened(evt.getProperty('edit'));
  }

  clear(): void {
    this.model.clear();
    this.root = this.graph.getDefaultParent();
  }
}
