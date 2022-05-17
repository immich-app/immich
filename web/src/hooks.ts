import type { GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { serverEndpoint } from '$lib/constants';

export const handle: Handle = async ({ event, resolve, }) => {

  const cookies = cookie.parse(event.request.headers.get('cookie') || '');

  if (!cookies.session) {
    return await resolve(event)
  }

  const { userEmail, isAdmin, firstName, lastName, userId, accessToken } = JSON.parse(cookies.session);

  const res = await fetch(`${serverEndpoint}/auth/validateToken`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (res.status === 201) {
    event.locals.user = {
      userId,
      accessToken,
      firstName,
      lastName,
      isAdmin,
      userEmail
    };
  }

  const response = await resolve(event);

  response.headers.set('Authorization', `Bearer ${accessToken}`);

  return response;
};

export const getSession: GetSession = async ({ locals }) => {
  if (!locals.user) return {}

  return {
    user: {
      userId: locals.user.userId,
      accessToken: locals.user.accessToken,
      firstName: locals.user.firstName,
      lastName: locals.user.lastName,
      isAdmin: locals.user.isAdmin,
      userEmail: locals.user.userEmail
    }
  }
}
