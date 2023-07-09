import { api } from '@api';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST = (async ({ cookies }) => {
  api.removeAccessToken();

  cookies.delete('immich_auth_type', { path: '/' });
  cookies.delete('immich_access_token', { path: '/' });

  return json({ ok: true });
}) satisfies RequestHandler;
