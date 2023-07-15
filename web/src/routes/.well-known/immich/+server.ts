import { json } from '@sveltejs/kit';

const endpoint = process.env.IMMICH_API_URL_EXTERNAL || '/api';

export const GET = async () => {
  return json({
    api: {
      endpoint,
    },
  });
};
