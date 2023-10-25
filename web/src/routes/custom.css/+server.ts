import { RequestHandler, text } from '@sveltejs/kit';
export const GET = (async ({ locals: { api } }) => {
  const {
    data: {
      theme: { customCss },
    },
  } = await api.serverInfoApi.getTheme();
  return text(customCss, {
    headers: {
      'Content-Type': 'text/css',
    },
  });
}) satisfies RequestHandler;
