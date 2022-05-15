import type { RequestHandler } from '@sveltejs/kit';

export const post: RequestHandler = async ({ request }) => {
  const form = await request.formData();

  const email = form.get('email')
  const password = form.get('password')

  console.log(email, password)
  return {}
}