let _basePath = '/api';

export function getFileUrl(aid: string, did: string, isThumb?: boolean, isWeb?: boolean) {
  return param2query(`${_basePath}/asset/file`, { aid, did, isThumb, isWeb });
}

function param2query(url: string, query: any) {
  let qs = Object.keys(query).map(key => `${key}=${query[key]}`).join('&');

  if (qs) url += '?' + qs;

  return url;
}
