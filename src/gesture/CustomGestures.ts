export interface Landmark {
  x: number;
  y: number;
  z: number;
}
const dist = (a: Landmark, b: Landmark) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function jointAngle(a: Landmark, b: Landmark, c: Landmark) {
  const u = [a.x - b.x, a.y - b.y, a.z - b.z],
    v = [c.x - b.x, c.y - b.y, c.z - b.z];
  return Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        u.reduce((s, x, i) => s + x * v[i], 0) /
          (Math.hypot(...u) * Math.hypot(...v) || 1),
      ),
    ),
  );
}
export function fingerExtended(l: Landmark[], base: number) {
  const scale = dist(l[0], l[9]);
  return (
    jointAngle(l[base], l[base + 1], l[base + 2]) > 2.65 &&
    jointAngle(l[base + 1], l[base + 2], l[base + 3]) > 2.65 &&
    dist(l[0], l[base + 3]) > dist(l[0], l[base + 1]) + scale * 0.25
  );
}
function folded(l: Landmark[], b: number) {
  return (
    jointAngle(l[b], l[b + 1], l[b + 2]) < 2.25 &&
    dist(l[0], l[b + 3]) < dist(l[0], l[b + 1]) + 0.1 * dist(l[0], l[9])
  );
}
export function middleFinger(l: Landmark[], knownGesture = "", confidence = 0) {
  if (l.length !== 21 || dist(l[0], l[9]) < 0.025) return false;
  const clear = fingerExtended(l, 9) && [5, 13, 17].every((b) => folded(l, b));
  return (
    clear && !(confidence > 0.9 && knownGesture && knownGesture !== "None")
  );
}
export function isolatedIndex(l: Landmark[]) {
  return (
    l.length === 21 &&
    fingerExtended(l, 5) &&
    [9, 13, 17].every((b) => folded(l, b))
  );
}

// Test both joins and the open space between them in camera coordinates.
// Neither MediaPipe's gesture label nor the left/right camera setting is needed.
export function heartHands(a: Landmark[], b: Landmark[]) {
  if (a.length !== 21 || b.length !== 21) return false;
  const gap = (p: Landmark, q: Landmark) => Math.hypot(p.x-q.x,p.y-q.y);
  const scale = (gap(a[0],a[9])+gap(b[0],b[9]))/2;
  if (scale < .025) return false;
  const [left,right] = a[5].x < b[5].x ? [a,b] : [b,a];
  const mid = (a[8].x+b[8].x)/2;
  return gap(a[8],b[8]) < .80*scale && gap(a[4],b[4]) < .80*scale
    && [a,b].every(h=>h[4].y-h[8].y > .30*scale && h[4].y-h[8].y < 2.4*scale)
    && mid-left[6].x > .18*scale && right[6].x-mid > .18*scale
    && Math.abs(mid-(a[4].x+b[4].x)/2) < .80*scale;
}
