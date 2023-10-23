import { text } from '@sveltejs/kit';
import type { ImmichApi } from '../../api/api';
export const GET = async ({ locals: { api } }: { locals: { api: ImmichApi } }) => {
  const { css } = await api.systemConfigApi.getConfig().then((res) => res.data.stylesheets);
  return text(css);
};
