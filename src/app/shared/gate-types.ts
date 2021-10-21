export interface Point {
  x: number;
  y: number;
}

export interface Gate {
  name: string;
  x: string
  y: string;
  points: Point[];
  children: Gate[];
  parent: Gate;
}
