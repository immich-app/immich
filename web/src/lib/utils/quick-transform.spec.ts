import { AssetEditAction, MirrorAxis } from '@immich/sdk';
import { describe, expect, it } from 'vitest';
import { foldTransform } from '$lib/utils/quick-transform';

const rotate = (angle: number) => ({ action: AssetEditAction.Rotate, parameters: { angle } });
const mirror = (axis: MirrorAxis) => ({ action: AssetEditAction.Mirror, parameters: { axis } });
const crop = { action: AssetEditAction.Crop, parameters: { x: 1, y: 2, width: 3, height: 4 } };

describe('foldTransform', () => {
  it('adds a rotation when there are no edits', () => {
    expect(foldTransform([], { kind: 'rotate', degrees: 90 })).toEqual([rotate(90)]);
  });

  it('merges repeated rotations into a single edit', () => {
    expect(foldTransform([rotate(90)], { kind: 'rotate', degrees: 90 })).toEqual([rotate(180)]);
  });

  it('normalises a full turn back to no rotation', () => {
    expect(foldTransform([rotate(270)], { kind: 'rotate', degrees: 90 })).toEqual([]);
  });

  it('normalises negative rotation into the 0-359 range', () => {
    expect(foldTransform([], { kind: 'rotate', degrees: -90 })).toEqual([rotate(270)]);
  });

  it('toggles a mirror off when the same axis is applied twice', () => {
    expect(foldTransform([mirror(MirrorAxis.Horizontal)], { kind: 'mirror', axis: MirrorAxis.Horizontal })).toEqual([]);
  });

  it('keeps mirrors on different axes independent', () => {
    expect(foldTransform([mirror(MirrorAxis.Horizontal)], { kind: 'mirror', axis: MirrorAxis.Vertical })).toEqual([
      mirror(MirrorAxis.Horizontal),
      mirror(MirrorAxis.Vertical),
    ]);
  });

  it('preserves unrelated edits such as a crop', () => {
    expect(foldTransform([crop, rotate(90)], { kind: 'rotate', degrees: 90 })).toEqual([crop, rotate(180)]);
  });

  it('drops the server-assigned id so the result is a valid create payload', () => {
    const withId = { ...crop, id: 'a2f1b6c8-0000-4000-8000-000000000000' };
    expect(foldTransform([withId], { kind: 'rotate', degrees: 90 })).toEqual([crop, rotate(90)]);
  });
});
