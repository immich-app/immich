import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import type { MirrorParameters, RotateParameters } from '@immich/sdk';
import { compose, flipX, flipY, identity, rotate } from 'transformation-matrix';

export function normalizeTransformEdits(edits: EditActions): {
  rotation: number;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
} {
  // construct an affine matrix from the edits
  // this is the same approach used in the backend to combine multiple transforms
  const matrix = compose(
    ...edits.map((edit) => {
      switch (edit.action) {
        case 'rotate': {
          const parameters = edit.parameters as RotateParameters;
          const angleInRadians = (-parameters.angle * Math.PI) / 180;
          return rotate(angleInRadians);
        }
        case 'mirror': {
          const parameters = edit.parameters as MirrorParameters;
          return parameters.axis === 'horizontal' ? flipY() : flipX();
        }
        default: {
          return identity();
        }
      }
    }),
  );

  let rotation = 0;
  let mirrorH = false;
  let mirrorV = false;

  let { a, b, c, d } = matrix;
  // round to avoid floating point precision issues
  a = Math.round(a);
  b = Math.round(b);
  c = Math.round(c);
  d = Math.round(d);

  // [ +/-1, 0, 0, +/-1 ] indicates a 0° or 180° rotation with possible mirrors
  // [ 0, +/-1, +/-1, 0 ] indicates a 90° or 270° rotation with possible mirrors
  if (Math.abs(a) == 1 && Math.abs(b) == 0 && Math.abs(c) == 0 && Math.abs(d) == 1) {
    rotation = a > 0 ? 0 : 180;
    mirrorH = rotation === 0 ? a < 0 : a > 0;
    mirrorV = rotation === 0 ? d < 0 : d > 0;
  } else if (Math.abs(a) == 0 && Math.abs(b) == 1 && Math.abs(c) == 1 && Math.abs(d) == 0) {
    rotation = c > 0 ? 90 : 270;
    mirrorH = rotation === 90 ? c < 0 : c > 0;
    mirrorV = rotation === 90 ? b > 0 : b < 0;
  }

  return {
    rotation,
    mirrorHorizontal: mirrorH,
    mirrorVertical: mirrorV,
  };
}
