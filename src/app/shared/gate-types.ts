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

export function validateTransform(t: Transform, errors: string[]): boolean {
  switch (t.transformType) {
    case TransformType.linear:
      {
        if (t.t <= 0.0) errors.push('T must be positive.');
        if (t.a < 0.0) errors.push('A must be non-negative.');
        if (t.a > t.t) errors.push('A must be less than or equal to T.');
      }
      break;

    case TransformType.log:
      {
        if (t.t <= 0.0) errors.push('T must be positive.');
        if (t.m <= 0.0) errors.push('M must be positive.');
      }
      break;

    case TransformType.logicle:
      {
        if (t.t <= 0.0) errors.push('T must be positive.');
        if (t.m <= 0.0) errors.push('M must be positive.');
        if (t.w < 0.0) errors.push('W must be non-negative.');
        if (t.w > t.m / 2.0) errors.push('W must be less than or equal M/2.');
        if (t.a < -t.w) errors.push('A must be greater than or equal to -W.');
        if (t.a > t.m - 2 * t.w)
          errors.push('A must be less than or equal to (M-2W).');
      }
      break;

    default:
      break;
  }

  return errors.length === 0;
}
