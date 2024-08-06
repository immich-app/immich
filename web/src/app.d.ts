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
