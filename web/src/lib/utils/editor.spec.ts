import { AssetEditAction, MirrorAxis } from '@immich/sdk';
import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import { buildAffineFromEdits, normalizeTransformEdits, splitRotation } from '$lib/utils/editor';

type NormalizedParameters = {
  rotation: number;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
};

function normalizedToEdits(params: NormalizedParameters): EditActions {
  const edits: EditActions = [];

  if (params.mirrorHorizontal) {
    edits.push({
      action: AssetEditAction.Mirror,
      parameters: { axis: MirrorAxis.Horizontal },
    });
  }

  if (params.mirrorVertical) {
    edits.push({
      action: AssetEditAction.Mirror,
      parameters: { axis: MirrorAxis.Vertical },
    });
  }

  if (params.rotation !== 0) {
    edits.push({
      action: AssetEditAction.Rotate,
      parameters: { angle: params.rotation },
    });
  }

  return edits;
}

function compareEditAffines(editsA: EditActions, editsB: EditActions): boolean {
  const normA = buildAffineFromEdits(editsA);
  const normB = buildAffineFromEdits(editsB);

  return (
    Math.abs(normA.a - normB.a) < 0.0001 &&
    Math.abs(normA.b - normB.b) < 0.0001 &&
    Math.abs(normA.c - normB.c) < 0.0001 &&
    Math.abs(normA.d - normB.d) < 0.0001
  );
}

describe('edit normalization', () => {
  it('should handle no edits', () => {
    const edits: EditActions = [];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 90° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 180° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 270° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single horizontal mirror', () => {
    const edits: EditActions = [{ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(result).toEqual({ rotation: 0, mirrorHorizontal: true, mirrorVertical: false });
    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single vertical mirror', () => {
    const edits: EditActions = [{ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(result).toEqual({ rotation: 0, mirrorHorizontal: false, mirrorVertical: true });
    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });
});

describe('splitRotation', () => {
  it('removes floating point residue from quarter-turn rotations', () => {
    expect(splitRotation(-90.000_000_000_000_01)).toEqual({ quarterTurn: 270, straightenAngle: 0 });
    expect(splitRotation(90.000_000_000_000_01)).toEqual({ quarterTurn: 90, straightenAngle: 0 });
  });

  it('keeps real straighten angles', () => {
    expect(splitRotation(100)).toEqual({ quarterTurn: 90, straightenAngle: 10 });
    expect(splitRotation(263)).toEqual({ quarterTurn: 270, straightenAngle: -7 });
  });

  it('keeps exact 45 degree boundaries as straighten angles', () => {
    expect(splitRotation(45)).toEqual({ quarterTurn: 0, straightenAngle: 45 });
    expect(splitRotation(-45)).toEqual({ quarterTurn: 0, straightenAngle: -45 });
  });
});
