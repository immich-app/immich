import type { ActionReturn } from 'svelte/action';

declare global {
  interface GlobalEventHandlersEventMap {
    'asset-opened': CustomEvent<AssetTarget>;
    'asset-closed': CustomEvent<AssetTarget>;
    'asset-changed': CustomEvent<AssetTargetChanged>;
  }
}

// Asset Custom Events
export type AssetOpenedEvent = GlobalEventHandlersEventMap[AssetOpened];
export type AssetClosedEvent = GlobalEventHandlersEventMap[AssetClosed];
export type AssetChangedEvent = GlobalEventHandlersEventMap[AssetChanged];

// Asset Event-types Union
export type AssetEventTypes = AssetOpened | AssetClosed | AssetChanged;

// Asset Event-types
export type AssetOpened = 'asset-opened';
export type AssetClosed = 'asset-closed';
export type AssetChanged = 'asset-changed';

// All Asset Detail Types
export type AssetDetail = AssetTarget | AssetTargetChanged;

// Asset Event Detail Types
export type AssetTarget = { assetId: string };
export type AssetTargetChanged = { fromAssetId: string; toAssetId: string };

export const createAssetEvent = <T extends AssetEventTypes>(
  type: T,
  detail: GlobalEventHandlersEventMap[T] extends CustomEvent<infer T> ? T : never,
) => new CustomEvent(type, { detail, bubbles: true });

interface Attributes {
  'on:asset-opened'?: (e: AssetOpenedEvent) => unknown;
  'on:asset-closed'?: (e: AssetClosedEvent) => unknown;
  'on:asset-changed'?: (e: AssetChangedEvent) => unknown;
}

/* Simply a way to add asset events to the element via use:assetEvents */
export function assetEvents(_: HTMLElement): ActionReturn<null, Attributes> {
  return {
    destroy() {},
  };
}
