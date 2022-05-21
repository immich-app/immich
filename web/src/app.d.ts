/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
  interface Locals {
    user?: {
      id: string,
      email: string,
      accessToken: string,
      firstName: string,
      lastName: string,
      isAdmin: boolean,
    }
  }

  // interface Platform {}

  interface Session {
    user?: {
      id: string,
      email: string,
      accessToken: string,
      firstName: string,
      lastName: string
      isAdmin: boolean,
    }
  }

  // interface Stuff {}
}

