import { assetCacheManager } from '$lib/managers/AssetCacheManager.svelte';
import type { Faces } from '$lib/stores/people.store';
import { CancellableTask } from '$lib/utils/cancellable-task';
import type { AssetFaceResponseDto, PersonResponseDto } from '@immich/sdk';
import { SvelteSet } from 'svelte/reactivity';

class FaceManager {
  #data = $state<AssetFaceResponseDto[]>([]);
  #faceLoader = new CancellableTask();
  #cleared = false;

  faceNameMap = $derived.by(() => {
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

  people = $derived.by(() => {
    const people = new SvelteSet<PersonResponseDto>();

    for (const face of this.data) {
      if (face.person) {
        people.add(face.person);
      }
    }

    return people;
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
