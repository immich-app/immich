import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import type { MirrorParameters, RotateParameters } from '@immich/sdk';
import { compose, flipX, flipY, identity, rotate } from 'transformation-matrix';

export function normalizeTransformEdits(edits: EditActions): {
  rotation: number;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
} {
  const { a, b, c, d } = buildAffineFromEdits(edits);

  // 1. Extract rotation (full quadrant-safe)
  let rotation = (Math.atan2(b, a) * 180) / Math.PI;
  rotation = ((rotation % 360) + 360) % 360;

  // 2. Build inverse rotation matrix
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Inverse rotation * original matrix
  const ua = cos * a + sin * c;
  const ud = -sin * b + cos * d;

  // 3. Detect mirrors in unrotated space
  const mirrorHorizontal = ua < 0;
  const mirrorVertical = ud < 0;

  // 4. Fold double mirrors into rotation
  if (mirrorHorizontal && mirrorVertical) {
    return {
      rotation: (rotation + 180) % 360,
      mirrorHorizontal: false,
      mirrorVertical: false,
    };
  }

  return {
    rotation,
    mirrorHorizontal,
    mirrorVertical,
  };
}

export function buildAffineFromEdits(edits: EditActions) {
  return compose(
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
}
