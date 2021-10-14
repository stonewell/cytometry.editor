const INF = 10000;

class Point
{
  x: number;
  y: number;

	constructor(x: any,y: any)
	{
		this.x = x;
		this.y = y;
	}
}


// Given three collinear points p, q, r,
// the function checks if point q lies
// on line segment 'pr'
function onSegment(p: any,q: any,r: any)
{
	if (q.x <= Math.max(p.x, r.x) &&
		q.x >= Math.min(p.x, r.x) &&
		q.y <= Math.max(p.y, r.y) &&
		q.y >= Math.min(p.y, r.y))
	{
		return true;
	}
	return false;
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function findOrientation(p: any,q: any,r: any)
{
	let val = (q.y - p.y) * (r.x - q.x)
		- (q.x - p.x) * (r.y - q.y);

	if (val == 0)
	{
		return 0; // collinear
	}
	return (val > 0) ? 1 : 2; // clock or counterclock wise
}

// The function that returns true if
// line segment 'p1q1' and 'p2q2' intersect.
function doIntersect(p1: any,q1: any,p2: any,q2: any)
{
	// Find the four orientations needed for
	// general and special cases
	let o1 = findOrientation(p1, q1, p2);
	let o2 = findOrientation(p1, q1, q2);
	let o3 = findOrientation(p2, q2, p1);
	let o4 = findOrientation(p2, q2, q1);

	// General case
	if (o1 != o2 && o3 != o4)
	{
		return true;
	}

	// Special Cases
	// p1, q1 and p2 are collinear and
	// p2 lies on segment p1q1
	if (o1 == 0 && onSegment(p1, p2, q1))
	{
		return true;
	}

	// p1, q1 and p2 are collinear and
	// q2 lies on segment p1q1
	if (o2 == 0 && onSegment(p1, q2, q1))
	{
		return true;
	}

	// p2, q2 and p1 are collinear and
	// p1 lies on segment p2q2
	if (o3 == 0 && onSegment(p2, p1, q2))
	{
		return true;
	}

	// p2, q2 and q1 are collinear and
	// q1 lies on segment p2q2
	if (o4 == 0 && onSegment(p2, q1, q2))
	{
		return true;
	}

	// Doesn't fall in any of the above cases
	return false;
}

// Returns true if the point p lies
// inside the polygon[] with n vertices
function checkInside(polygon: any,n: any,p: any)
{
	// There must be at least 3 vertices in polygon[]
	if (n < 3)
	{
		return false;
	}

	// Create a point for line segment from p to infinite
	let extreme = new Point(INF, p.y);

	// Count intersections of the above line
	// with sides of polygon
	let count = 0, i = 0;
	do
	{
		let next = (i + 1) % n;

		// Check if the line segment from 'p' to
		// 'extreme' intersects with the line
		// segment from 'polygon[i]' to 'polygon[next]'
		if (doIntersect(polygon[i], polygon[next], p, extreme))
		{
			// If the point 'p' is colinear with line
			// segment 'i-next', then check if it lies
			// on segment. If it lies, return true, otherwise false
			if (findOrientation(polygon[i], p, polygon[next]) == 0)
			{
				return onSegment(polygon[i], p,
									       polygon[next]);
			}

			count++;
		}
		i = next;
	} while (i != 0);

	// Return true if count is odd, false otherwise
	return (count % 2 == 1); // Same as (count%2 == 1)
}

function vertexToPoint(vertex: any) {
  const state = vertex.getState();

  return new Point(state.x, state.y);
}

function getNextVertex(fromEdge: any, vertex: any) {
  let e = undefined;
  if (vertex.e1 && vertex.e1 != fromEdge) {
    e = vertex.e1;
  } else if (vertex.e2 && vertex.e2 != fromEdge) {
    e = vertex.e2;
  }

  if (!e) {
    return [undefined, undefined];
  }

  return [e, e.v1 === vertex ? e.v2 : e.v1];
}

export function isInside(vertex: any, x: number, y: number): boolean {
  const polygon: Point[] = [];

  polygon.push(vertexToPoint(vertex));

  let r = getNextVertex(undefined, vertex);

  while(r[0] && r[1] !== vertex) {
    polygon.push(vertexToPoint(r[1]));

    r = getNextVertex(r[0], r[1]);
  }

  return checkInside(polygon, polygon.length,
                     new Point(x, y));
}
