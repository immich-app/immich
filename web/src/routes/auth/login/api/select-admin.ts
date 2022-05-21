import type { RequestHandler } from '@sveltejs/kit';
import { putRequest } from '$lib/api';
import * as cookie from 'cookie';

export const post: RequestHandler = async ({ request, locals }) => {

  const { id, isAdmin } = await request.json()

  const res = await putRequest('user', {
    id,
    isAdmin,
  }, locals.user!.accessToken);



  if (res.statusCode) {
    return {
      status: res.statusCode,
      body: JSON.stringify(res)
    }
  }

  if (res.id == locals.user!.id) {
    return {
      status: 200,
      body: { userInfo: res },
      headers: {
        'Set-Cookie': cookie.serialize('session', JSON.stringify(
          {
            id: res.id,
            accessToken: locals.user!.accessToken,
            firstName: res.firstName,
            lastName: res.lastName,
            isAdmin: res.isAdmin,
            email: res.email,
          }), {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30,
        })
      }
    }
  } else {
    return {
      status: 200,
      body: { userInfo: { ...locals.user! } },
    }
  }


}