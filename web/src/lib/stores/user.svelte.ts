import { eventManager } from '$lib/managers/event-manager.svelte';

interface UserInteractions {
  aboutInfo?: { version: string } | undefined;
}

const defaultUserInteraction: UserInteractions = {
  aboutInfo: undefined,
};

export const userInteraction = $state<UserInteractions>(defaultUserInteraction);

const reset = () => {
  Object.assign(userInteraction, defaultUserInteraction);
};

eventManager.on({
  AuthLogout: () => reset(),
});
