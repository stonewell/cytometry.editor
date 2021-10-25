export interface Point {
  x: number;
  y: number;
}

export interface Gate {
  name: string;
  customName: boolean;
  x: string;
  y: string;
  points: Point[];
  children: Gate[];
  parent: Gate;
}
