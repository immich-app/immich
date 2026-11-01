import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getAllTagsQuery } from '#lib/queries/tag.query.ts';
import { publicTags } from '#lib/utils/tree-utils.ts';
import type { AuthStatusResponseDto } from '@immich/sdk';

class PrivateSessionManager {
  #cleanup: Promise<void> | undefined;
  #wasElevated = false;

  observe(status: AuthStatusResponseDto | undefined) {
    if (!status) {
      this.#wasElevated = false;
      return;
    }
    if (this.#wasElevated && !status.isElevated) {
      void this.clear();
    }
    this.#wasElevated = status.isElevated;
    if (!status.isElevated || !status.pinExpiresAt) {
      return;
    }
    const { pinExpiresAt } = status;
    const timer = setTimeout(
      () => {
        queryClient.setQueryData(getAuthStatusQuery().queryKey, (current) =>
          current?.pinExpiresAt === pinExpiresAt ? { ...current, isElevated: false, pinExpiresAt: undefined } : current,
        );
      },
      Math.max(0, Date.parse(pinExpiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }

  clear() {
    this.#cleanup ??= this.#removePrivateContent().finally(() => {
      this.#cleanup = undefined;
    });
    return this.#cleanup;
  }

  async #removePrivateContent() {
    queryClient.setQueryData(getAllTagsQuery().queryKey, (tags) => tags && publicTags(tags));
    const queryKeys = [
      QueryKeys.assets(),
      QueryKeys.activities(),
      QueryKeys.timeline(),
      QueryKeys.search(),
      QueryKeys.albums(),
      QueryKeys.sharedLinks(),
      QueryKeys.stacks(),
      QueryKeys.memories(),
      QueryKeys.map(),
      QueryKeys.people(),
    ];
    const reset = Promise.all(queryKeys.map((queryKey) => queryClient.resetQueries({ queryKey })));
    eventManager.emit('SessionLocked');
    await reset;
    await queryClient.invalidateQueries({ queryKey: QueryKeys.tags() });
  }
}

export const privateSessionManager = new PrivateSessionManager();
