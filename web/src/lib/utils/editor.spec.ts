import type { EditActions } from '#lib/managers/edit/edit-manager.svelte.ts';
import { buildAffineFromEdits, normalizeTransformEdits } from '#lib/utils/editor.ts';
import { AssetEditAction, MirrorAxis } from '@immich/sdk';

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

const rotate = (angle: number): EditActions[number] => ({ action: AssetEditAction.Rotate, parameters: { angle } });
const mirror = (axis: MirrorAxis): EditActions[number] => ({ action: AssetEditAction.Mirror, parameters: { axis } });
const horizontal = mirror(MirrorAxis.Horizontal);
const vertical = mirror(MirrorAxis.Vertical);

describe('normalizeTransformEdits', () => {
  it.each<{ name: string; edits: EditActions }>([
    { name: 'no edits', edits: [] },
    { name: '90° rotation', edits: [rotate(90)] },
    { name: '180° rotation', edits: [rotate(180)] },
    { name: '270° rotation', edits: [rotate(270)] },
    { name: 'horizontal mirror', edits: [horizontal] },
    { name: 'vertical mirror', edits: [vertical] },
    { name: '90° rotation then horizontal mirror', edits: [rotate(90), horizontal] },
    { name: '90° rotation then vertical mirror', edits: [rotate(90), vertical] },
    { name: '90° rotation then both mirrors', edits: [rotate(90), horizontal, vertical] },
    { name: '180° rotation then horizontal mirror', edits: [rotate(180), horizontal] },
    { name: '180° rotation then vertical mirror', edits: [rotate(180), vertical] },
    { name: '180° rotation then both mirrors', edits: [rotate(180), horizontal, vertical] },
    { name: '270° rotation then horizontal mirror', edits: [rotate(270), horizontal] },
    { name: '270° rotation then vertical mirror', edits: [rotate(270), vertical] },
    { name: '270° rotation then both mirrors', edits: [rotate(270), horizontal, vertical] },
    { name: 'horizontal mirror then 90° rotation', edits: [horizontal, rotate(90)] },
    { name: 'horizontal mirror then 180° rotation', edits: [horizontal, rotate(180)] },
    { name: 'horizontal mirror then 270° rotation', edits: [horizontal, rotate(270)] },
    { name: 'vertical mirror then 90° rotation', edits: [vertical, rotate(90)] },
    { name: 'vertical mirror then 180° rotation', edits: [vertical, rotate(180)] },
    { name: 'vertical mirror then 270° rotation', edits: [vertical, rotate(270)] },
    { name: 'both mirrors then 90° rotation', edits: [horizontal, vertical, rotate(90)] },
    { name: 'both mirrors then 180° rotation', edits: [horizontal, vertical, rotate(180)] },
    { name: 'both mirrors then 270° rotation', edits: [horizontal, vertical, rotate(270)] },
  ])('keeps the same transform for $name', ({ edits }) => {
    const normalized = normalizedToEdits(normalizeTransformEdits(edits));

    expect(compareEditAffines(normalized, edits)).toBe(true);
  });
});
