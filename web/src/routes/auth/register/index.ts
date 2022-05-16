import type { RequestHandler } from '@sveltejs/kit';
export const post: RequestHandler = async ({ request }) => {
  const form = await request.formData();

  const email = form.get('email')
  const password = form.get('password')
  const firstName = form.get('firstName')
  const lastName = form.get('lastName')

  fetch('')

  console.log(email, password, firstName, lastName)
  return {}
}