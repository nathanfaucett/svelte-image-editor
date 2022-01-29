import type { mat2d } from 'gl-matrix';
import { vec2 } from 'gl-matrix';

export function composeMat2d(out: mat2d, position: vec2, scale: vec2, rotation: number): mat2d {
	const sx = scale[0],
		sy = scale[1],
		c = Math.cos(rotation),
		s = Math.sin(rotation);

	out[0] = c * sx;
	out[1] = s * sx;
	out[2] = -s * sy;
	out[3] = c * sy;
	out[4] = position[0];
	out[5] = position[1];

	return out;
}

export function getAngleBetweenPoints(a: vec2, b: vec2): number {
	const sign = b[1] < a[1] ? -1 : 1;
	return Math.acos(vec2.dot(a, b) / (vec2.len(a) * vec2.len(b))) * sign;
}
