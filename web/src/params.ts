import { defineParams } from '@sveltejs/kit/params';

const UUID_REGEX = /^[\dA-Fa-f]{8}(?:\b-[\dA-Fa-f]{4}){3}\b-[\dA-Fa-f]{12}$/;

/* Returns true if the given param matches UUID format */
const matchId = (param: string) => {
  return UUID_REGEX.test(param);
};

const matchPhotos = (param: string) => {
  return param === 'photos';
};

export const params = defineParams({
  id: (param) => (matchId(param) ? param : undefined),
  photos: (param) => (matchPhotos(param) ? param : undefined),
});
