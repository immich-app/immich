import type { AssetPackage } from '$lib/managers/asset-manager/asset-package.svelte';

export const assetPackage = (assetPackage: AssetPackage): AssetPackage => $state.snapshot(assetPackage);
