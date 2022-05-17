/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
  interface Locals {
    user?: {
      userId: string,
      userEmail: string,
      accessToken: string,
      firstName: string,
      lastName: string,
      isAdmin: boolean,
    }
  }

  // interface Platform {}

  interface Session {
    user?: {
      userId: string,
      userEmail: string,
      accessToken: string,
      firstName: string,
      lastName: string
      isAdmin: boolean,
    }
  }

  // interface Stuff {}
}

