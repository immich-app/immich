import { RequestHandler, text } from '@sveltejs/kit';
export const GET = (async ({ locals: { api } }) => {
  const config = await api.serverInfoApi.getServerConfig();
  return text(config.data.customCss, {
    headers: {
      'Content-Type': 'text/css',
    },
  });
}) satisfies RequestHandler;
