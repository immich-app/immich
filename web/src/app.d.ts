/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
  interface PageData {
    meta: {
      title: string;
      description?: string;
      imageUrl?: string;
    };
  }

  interface Error {
    message: string;
    stack?: string;
    code?: string | number;
  }
}

declare module '$env/static/public' {
  export const PUBLIC_IMMICH_PAY_HOST: string;
  export const PUBLIC_IMMICH_BUY_HOST: string;
}

interface Element {
  // Make optional, because it's unavailable on iPhones.
  requestFullscreen?(options?: FullscreenOptions): Promise<void>;
}

import type en from '$lib/i18n/en.json';
import 'svelte-i18n';

type NestedKeys<T, K = keyof T> = K extends keyof T & string
  ? `${K}` | (T[K] extends object ? `${K}.${NestedKeys<T[K]>}` : never)
  : never;

declare module 'svelte-i18n' {
  import type { InterpolationValues } from '$lib/components/i18n/format-message.svelte';
  import type { Readable } from 'svelte/store';

  type Translations = NestedKeys<typeof en>;

  interface MessageObject {
    id: Translations;
    locale?: string;
    format?: string;
    default?: string;
    values?: InterpolationValues;
  }

  type MessageFormatter = (id: Translations | MessageObject, options?: Omit<MessageObject, 'id'>) => string;

  const format: Readable<MessageFormatter>;
  const t: Readable<MessageFormatter>;
  const _: Readable<MessageFormatter>;
}
