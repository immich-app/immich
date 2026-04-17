import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import type { MirrorParameters, RotateParameters } from '@immich/sdk';
import { compose, flipX, flipY, identity, rotate } from 'transformation-matrix';

const isCloseToZero = (x: number, epsilon: number = 1e-15) => Math.abs(x) < epsilon;

export const normalizeTransformEdits = (
  edits: EditActions,
): {
  rotation: number;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
} => {
  const { a, b, c, d } = buildAffineFromEdits(edits);
  const rotation = ((isCloseToZero(a) ? Math.asin(c) : Math.acos(a)) * 180) / Math.PI;

  return {
    rotation: rotation < 0 ? 360 + rotation : rotation,
    mirrorHorizontal: false,
    mirrorVertical: isCloseToZero(a) ? b === c : a === -d,
  };
};

export const buildAffineFromEdits = (edits: EditActions) =>
  compose(
    identity(),
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
