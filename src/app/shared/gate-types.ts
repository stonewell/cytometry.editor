export interface Point {
  x: number;
  y: number;
}

export interface Gate {
  name: string;
  customName: boolean;
  x: string;
  y: string;
  plotKey: string;
  points: Point[];
  children: Gate[];
  parent?: Gate;
  xTransform?: Transform;
  yTransform?: Transform;
}

export enum TransformType {
  none = 'none',
  linear = 'linear',
  log = 'log',
  logicle = 'logicle',
  predefined = 'predefined',
}

export interface Transform {
  transformType: TransformType;

  a: number;
  t: number;
  m: number;
  w: number;

  predefinedName: string;
}

export function gateFromJSON(value: string): Gate {
  return gateFromJSONObject(JSON.parse(value), undefined);
}

export function gateFromJSONObject(obj: any, parent: any) {
  const gate: Gate = {
    name: obj['name'],
    customName: obj['customName'] === 1 ? true : false,
    x: obj['x'],
    y: obj['y'],
    plotKey: obj['ployKey'],
    points:
      obj['points']?.map((p: any) => {
        return { x: p['x'], y: p['y'] };
      }) || [],
    children: [],
    parent: parent as Gate,
  };

  gate.children =
    obj['children']?.map((c: any) => gateFromJSONObject(c, gate)) || [];

  return gate;
}

export function gateToJSON(g: Gate): string {
  return `{"name":"${g.name}", "customName":${g.customName ? 1 : 0}, "x":"${
    g.x
  }", "y":"${g.y}", "points":[${
    g.points?.map((p) => pointToJSON(p)).join(',') || ''
  }], "children":[${
    g.children?.map((c) => gateToJSON(c)).join(',') || ''
  }], "plotKey":"${g.plotKey}"}`;
}

export function pointToJSON(p: any): string {
  return `{"x":${p.x}, "y":${p.y}}`;
}
