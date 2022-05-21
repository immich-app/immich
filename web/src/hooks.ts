import type { ExternalFetch, GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { serverEndpoint } from '$lib/constants';
import { session } from '$app/stores';


export const handle: Handle = async ({ event, resolve, }) => {
  const cookies = cookie.parse(event.request.headers.get('cookie') || '');

  if (!cookies.session) {
    return await resolve(event)
  }

  const { email, isAdmin, firstName, lastName, id, accessToken } = JSON.parse(cookies.session);

  const res = await fetch(`${serverEndpoint}/auth/validateToken`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (res.status === 201) {
    event.locals.user = {
      id,
      accessToken,
      firstName,
      lastName,
      isAdmin,
      email
    };
  }

  const response = await resolve(event);

  return response;
};

export const getSession: GetSession = async ({ locals }) => {

  if (!locals.user) return {}

  return {
    user: {
      id: locals.user.id,
      accessToken: locals.user.accessToken,
      firstName: locals.user.firstName,
      lastName: locals.user.lastName,
      isAdmin: locals.user.isAdmin,
      email: locals.user.email
    }
  }
}

