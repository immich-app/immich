import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';

export const post: RequestHandler = async ({ request }) => {
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

  const res = await fetch(`${serverEndpoint}/auth/admin-sign-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) {
    return {
      status: 201,
      body: {
        success: 'Succesfully create admin account'
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