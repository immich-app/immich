import type { AssetFaceResponseDto, PersonResponseDto } from '@immich/sdk';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
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
      map.set(face, face.person.name);
    }

    return map;
  });

  readonly people = $derived.by(() => {
    const people = new SvelteSet<PersonResponseDto>();

    for (const face of this.data) {
      if (face.person) {
        people.add(face.person);
      }
    }

    return people;
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
    this.#data = [];
  }
}

export const faceManager = new FaceManager();
