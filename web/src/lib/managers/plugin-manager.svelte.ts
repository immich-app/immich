import {
  getWorkflowTriggers,
  searchPluginMethods,
  searchPluginTemplates,
  WorkflowTrigger,
  type PluginMethodResponseDto,
  type PluginTemplateResponseDto,
  type WorkflowTriggerResponseDto,
} from '@immich/sdk';
import { t } from 'svelte-i18n';
import { SvelteMap } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';

class PluginManager {
  #loading: Promise<void> | undefined;
  #methodMap = new SvelteMap<string, PluginMethodResponseDto>();
  #methods = $state<PluginMethodResponseDto[]>([]);
  #triggers = $state<WorkflowTriggerResponseDto[]>([]);
  #templates = $state<PluginTemplateResponseDto[]>([]);

  constructor() {
    eventManager.on({
      AuthLogout: () => this.clearCache(),
      AuthUserLoaded: () => this.initialize(),
    });

    // loaded event might have already happened
    if (authManager.authenticated) {
      void this.initialize();
    }
  }

  get triggers() {
    return this.#triggers;
  }

  get templates() {
    return this.#templates;
  }

  ready() {
    return this.initialize();
  }

  getMethod(key: string) {
    return this.#methodMap.get(key);
  }

  getMethodLabel(key: string) {
    const method = this.getMethod(key);
    return method?.title ?? get(t)('unknown');
  }

  getTrigger(trigger: WorkflowTrigger) {
    const result = this.#triggers.find((t) => t.trigger === trigger);

    if (!result) {
      throw new Error(`Unknown trigger type: ${trigger}`);
    }

    return result;
  }

  private clearCache() {
    this.#loading = undefined;
    this.#methodMap = new SvelteMap();
  }

  private initialize() {
    if (!this.#loading) {
      this.#loading = this.load();
    }

    return this.#loading;
  }

  private async load() {
    const [methods, triggers, templates] = await Promise.all([
      searchPluginMethods({}),
      getWorkflowTriggers(),
      searchPluginTemplates(),
    ]);

    this.#methods = methods;
    for (const method of this.#methods) {
      this.#methodMap.set(method.key, method);
    }

    this.#triggers = triggers;
    this.#templates = templates;
  }
}

export const pluginManager = new PluginManager();
