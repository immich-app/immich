import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';

export const post: RequestHandler = async ({ request, locals }) => {
  const form = await request.formData();

  const email = form.get('email')
  const password = form.get('password')
  const firstName = form.get('firstName')
  const lastName = form.get('lastName')

  const payload = {
    email,
    password,
    firstName,
    lastName,
  }

  const res = await fetch(`${serverEndpoint}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${locals.user?.accessToken}`
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) {
    return {
      status: 201,
      body: {
        success: 'Succesfully create user account'
      }
    }
  } else {
    return {
      status: 400,
      body: {
        error: await res.json()
      }
    }

  }
}