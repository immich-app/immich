import type { AssetFaceResponseDto, PersonResponseDto } from '@immich/sdk';
import { SvelteMap } from 'svelte/reactivity';
import { assetCacheManager } from '$lib/managers/AssetCacheManager.svelte';
import type { Faces } from '$lib/managers/asset-viewer-manager.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';

class FaceManager {
  #data = $state<AssetFaceResponseDto[]>([]);
  #faceLoader = new CancellableTask();
  #cleared = false;

  readonly faceNames = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<Faces, string>();

    for (const face of this.data) {
      if (!face.person) {
        continue;
      }
      map.set(face, face.person.name ?? '');
    }

    return map;
  });

  readonly people = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const people = new Map<string, PersonResponseDto>();

    for (const face of this.data) {
      if (face.person) {
        people.set(face.person.id, face.person);
      }
    }

    return Array.from(people.values());
  });

  readonly facesByPersonId = $derived.by(() => {
    const map = new SvelteMap<string, AssetFaceResponseDto[]>();
    for (const face of faceManager.data) {
      if (!face.person) {
        continue;
      }
      const existing = map.get(face.person.id);
      if (existing) {
        existing.push(face);
      } else {
        map.set(face.person.id, [face]);
      }
    }
    return map;
  });

  get data() {
    return this.#data;
  }

  async getAssetFaces(id: string) {
    if (this.#cleared) {
      await this.#faceLoader.reset();
      this.#cleared = false;
    }
    await this.#faceLoader.execute(async () => {
      this.#data = await assetCacheManager.getAssetFaces(id);
    }, false);
  }

  clear() {
    this.#cleared = true;
    assetCacheManager.clearFaceCache();
    this.#data = [];
  }
}

export const faceManager = new FaceManager();
