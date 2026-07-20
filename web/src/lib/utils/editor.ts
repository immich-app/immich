import { AssetEditAction, MirrorAxis, type MirrorParameters, type RotateParameters } from '@immich/sdk';
import { compose, flipX, flipY, identity, rotate } from 'transformation-matrix';
import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';

const isCloseToZero = (x: number, epsilon: number = 1e-15) => Math.abs(x) < epsilon;
const isClose = (a: number, b: number, epsilon: number = 1e-10) => Math.abs(a - b) < epsilon;

type NormalizedTransform = {
  rotation: number;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
};

const normalizeAngle = (angle: number) => (isCloseToZero(angle) ? 0 : angle);

const areAffinesClose = (
  affineA: ReturnType<typeof buildAffineFromEdits>,
  affineB: ReturnType<typeof buildAffineFromEdits>,
): boolean =>
  isClose(affineA.a, affineB.a) &&
  isClose(affineA.b, affineB.b) &&
  isClose(affineA.c, affineB.c) &&
  isClose(affineA.d, affineB.d);

const candidateToEdits = ({ rotation, mirrorHorizontal, mirrorVertical }: NormalizedTransform): EditActions => {
  const edits: EditActions = [];

  if (mirrorHorizontal) {
    edits.push({ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } });
  }

  if (mirrorVertical) {
    edits.push({ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } });
  }

  if (rotation !== 0) {
    edits.push({ action: AssetEditAction.Rotate, parameters: { angle: rotation } });
  }

  return edits;
};

export const splitRotation = (angle: number) => {
  let straightenAngle = angle % 90;
  if (straightenAngle > 45) {
    straightenAngle -= 90;
  }
  if (straightenAngle < -45) {
    straightenAngle += 90;
  }
  if (Math.abs(straightenAngle) < 1e-10) {
    straightenAngle = 0;
  }

  const quarterTurn = (((Math.round((angle - straightenAngle) / 90) * 90) % 360) + 360) % 360;
  return { quarterTurn, straightenAngle };
};

export const normalizeTransformEdits = (edits: EditActions): NormalizedTransform => {
  const target = buildAffineFromEdits(edits);
  const preferredMirrorHorizontal =
    edits.filter(
      (edit) =>
        edit.action === AssetEditAction.Mirror && (edit.parameters as MirrorParameters).axis === MirrorAxis.Horizontal,
    ).length %
      2 ===
    1;
  const preferredMirrorVertical =
    edits.filter(
      (edit) =>
        edit.action === AssetEditAction.Mirror && (edit.parameters as MirrorParameters).axis === MirrorAxis.Vertical,
    ).length %
      2 ===
    1;

  const mirrorCandidates = [
    { mirrorHorizontal: preferredMirrorHorizontal, mirrorVertical: preferredMirrorVertical },
    { mirrorHorizontal: false, mirrorVertical: false },
    { mirrorHorizontal: true, mirrorVertical: false },
    { mirrorHorizontal: false, mirrorVertical: true },
    { mirrorHorizontal: true, mirrorVertical: true },
  ];

  for (const { mirrorHorizontal, mirrorVertical } of mirrorCandidates) {
    const rotationRadians = mirrorHorizontal ? Math.atan2(-target.c, -target.a) : Math.atan2(target.c, target.a);
    const candidate = {
      rotation: normalizeAngle((rotationRadians * 180) / Math.PI),
      mirrorHorizontal,
      mirrorVertical,
    };

    if (areAffinesClose(buildAffineFromEdits(candidateToEdits(candidate)), target)) {
      return candidate;
    }
  }

  return {
    rotation: normalizeAngle((Math.atan2(target.c, target.a) * 180) / Math.PI),
    mirrorHorizontal: false,
    mirrorVertical: isCloseToZero(target.a) ? target.b === target.c : target.a === -target.d,
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
