let cache: Cache | undefined;

const getCache = async () => {
  cache ||= await openCache();
  return cache;
};

const openCache = async () => {
  const [key] = await caches.keys();
  if (key) {
    return caches.open(key);
  }
};

export const isCached = async (req: Request) => {
  const cache = await getCache();
  return !!(await cache?.match(req));
};
