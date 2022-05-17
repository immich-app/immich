import type { GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { serverEndpoint } from '$lib/constants';

export const handle: Handle = async ({ event, resolve, }) => {

  const cookies = cookie.parse(event.request.headers.get('cookie') || '');

  if (!cookies.session) {
    return await resolve(event)
  }

  const { userId, accessToken } = JSON.parse(cookies.session);

  const res = await fetch(`${serverEndpoint}/auth/validateToken`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (res.status === 201) {
    event.locals.isAuthenticated = true;
  }

  return await resolve(event);
};

export const getSession: GetSession = async ({ locals }) => {
  console.log(locals, locals.isAuthenticated)
}