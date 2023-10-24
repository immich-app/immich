import { RequestHandler, text } from '@sveltejs/kit';
export const GET = (async ({ locals: { api } }) => {
  const { customCss } = await api.systemConfigApi.getConfig().then((res) => res.data.theme);
  return text(customCss, {
    headers: {
      'Content-Type': 'text/css',
    },
  });
}) satisfies RequestHandler;
