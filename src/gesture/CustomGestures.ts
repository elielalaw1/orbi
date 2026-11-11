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
