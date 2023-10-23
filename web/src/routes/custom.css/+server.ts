import { text } from '@sveltejs/kit';
export const GET = (async ({ locals: { api } }) => {
  const { css } = await api.systemConfigApi.getConfig().then((res) => res.data.stylesheets)
  return text(css)
});
