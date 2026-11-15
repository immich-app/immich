import { QueryParameter, UUID_REGEX } from '#lib/constants.ts';
import { memoryManager } from '#lib/managers/memory-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const $t = await getFormatter();

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, Route.memories());
  }

  await memoryManager.loading;

  const memory = await memoryManager.loadMemory(params.id);
  if (!memory) {
    redirect(307, memoryManager.memoriesHref);
  }

  if (params.assetId) {
    const targetMemory = memoryManager.getMemoryWithAsset(params.assetId, memory.id);
    if (targetMemory && targetMemory.id !== memory.id) {
      redirect(307, Route.viewMemoryAsset({ id: targetMemory.id, assetId: params.assetId }));
    }
  }

  const assetIds = new Set(memory.assets.map((asset) => asset.id));
  const assetId =
    [params.assetId, url.searchParams.get(QueryParameter.ASSET_ID)].find((id) => id && assetIds.has(id)) ??
    memory.assets[0]?.id;

  if (!assetId) {
    redirect(307, memoryManager.memoriesHref);
  }

  if (url.searchParams.get(QueryParameter.ASSET_ID) !== assetId) {
    const target = new URL(url);
    target.searchParams.set(QueryParameter.ASSET_ID, assetId);
    redirect(307, target.pathname + target.search);
  }

  return {
    meta: {
      title: $t('memory'),
    },
  };
}) satisfies PageLoad;
