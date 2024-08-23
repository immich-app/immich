import CropTool from '$lib/components/asset-viewer/editor/crop-tool/crop-tool.svelte';
import { updateAsset, type AssetResponseDto, type CropOptionsDto } from '@immich/sdk';
import { mdiCropRotate } from '@mdi/js';
import { derived, get, writable } from 'svelte/store';

//---------crop
export const cropSettings = writable<CropOptionsDto>({ x: 0, y: 0, width: 100, height: 100 });
export const cropImageSize = writable([1000, 1000]);
export const cropImageScale = writable(1);
export const cropAspectRatio = writable<CropAspectRatio>('free');
export const cropSettingsChanged = writable<boolean>(false);
//---------rotate
export const rotateDegrees = writable<number>(0);
export const normalizedRotateDegrees = derived(rotateDegrees, (v) => {
  const newAngle = v % 360;
  return newAngle < 0 ? newAngle + 360 : newAngle;
});
export const changedOriention = derived(normalizedRotateDegrees, () => get(normalizedRotateDegrees) % 180 > 0);
//-----other
export const showCancelConfirmDialog = writable<boolean | CallableFunction>(false);

export const editTypes = [
  {
    name: 'crop',
    icon: mdiCropRotate,
    component: CropTool,
    changesFlag: cropSettingsChanged,
    lossless: true,
    async apply(asset: AssetResponseDto) {
      const crop = get(cropSettings);
      const [x, y, width, height] = [crop.x, crop.y, crop.width, crop.height].map((v) => Math.round(v));
      await updateAsset({ id: asset.id, updateAssetDto: { crop: { x, y, width, height } } });
      asset.exifInfo = { ...asset.exifInfo, cropLeft: x, cropTop: y, cropWidth: width, cropHeight: height };
    },
  },
];

export function closeEditorConfirm(closeCallback: CallableFunction) {
  if (get(hasChanges)) {
    showCancelConfirmDialog.set(closeCallback);
  } else {
    closeCallback();
  }
}

export const hasChanges = derived(
  editTypes.map((t) => t.changesFlag),
  ($flags) => {
    return $flags.some(Boolean);
  },
);

export const hasLossyChanges = derived(
  editTypes.filter((t) => !t.lossless).map((t) => t.changesFlag),
  ($flags) => {
    return $flags.some(Boolean);
  },
);

export async function applyChanges(asset: AssetResponseDto, closeCallback: CallableFunction) {
  if (get(hasLossyChanges)) {
    closeCallback();
    return; // not supported yet
  }

  for (const type of editTypes) {
    if (get(type.changesFlag)) {
      await type.apply(asset);
    }
  }

  setTimeout(closeCallback, 1000);
}

export function resetGlobalCropStore() {
  cropSettings.set({ x: 0, y: 0, width: 100, height: 100 });
  cropImageSize.set([1000, 1000]);
  cropImageScale.set(1);
  cropAspectRatio.set('free');
  cropSettingsChanged.set(false);
  showCancelConfirmDialog.set(false);
  rotateDegrees.set(0);
}

export type CropAspectRatio =
  | '1:1'
  | '16:9'
  | '4:3'
  | '3:2'
  | '7:5'
  | '9:16'
  | '3:4'
  | '2:3'
  | '5:7'
  | 'free'
  | 'reset';
