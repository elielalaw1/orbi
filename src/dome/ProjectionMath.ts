// Adapted from EX-03 Pulse by David Cuartielles / Wisdome 360 (GPL-3.0).
export const DEG = Math.PI / 180,
  FOV = 160,
  TILT = 26;
export type Vec3 = [number, number, number];
export function masterToRoom(x: number, y: number): Vec3 | null {
  const r = Math.hypot(x, y);
  if (r > 1 + 1e-10) return null;
  const th = r * 80 * DEG,
    k = r > 1e-8 ? Math.sin(th) / r : 0;
  const lx = x * k,
    ly = -y * k,
    lz = Math.cos(th),
    c = Math.cos(TILT * DEG),
    s = Math.sin(TILT * DEG);
  return [lx, ly * c + lz * s, -ly * s + lz * c];
}
export function roomDirection(az: number, el: number): Vec3 {
  return [
    Math.sin(az * DEG) * Math.cos(el * DEG),
    Math.cos(az * DEG) * Math.cos(el * DEG),
    Math.sin(el * DEG),
  ];
}
export function roomToMaster(az: number, el: number): [number, number] {
  const [x, y, z] = roomDirection(az, el),
    c = Math.cos(TILT * DEG),
    s = Math.sin(TILT * DEG),
    ly = y * c - z * s,
    lz = y * s + z * c;
  const th = Math.acos(Math.max(-1, Math.min(1, lz))),
    k = Math.hypot(x, ly) > 1e-9 ? th / (80 * DEG) / Math.hypot(x, ly) : 0;
  return [x * k, -ly * k];
}
export function angles(v: Vec3) {
  return { az: Math.atan2(v[0], v[1]) / DEG, el: Math.asin(v[2]) / DEG };
}
