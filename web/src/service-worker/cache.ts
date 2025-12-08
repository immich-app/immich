import { version } from '$service-worker';

const CACHE = `cache-${version}`;

let _cache: Cache | undefined;
const getCache = async () => {
  if (_cache) {
    return _cache;
  }
  _cache = await caches.open(CACHE);
  return _cache;
};

export const get = async (key: string) => {
  const cache = await getCache();
  if (!cache) {
    return;
  }

  return cache.match(key);
};

export const put = async (key: string, response: Response) => {
  if (response.status !== 200) {
    return;
  }

  const cache = await getCache();
  if (!cache) {
    return;
  }

  await cache.put(key, response.clone());
};

export const prune = async () => {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
};
