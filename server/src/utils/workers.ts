const WORKER_TYPES = new Set(['api', 'microservices']);

export const getWorkers = () => {
  let workers = ['api', 'microservices'];
  const includedWorkers = process.env.IMMICH_WORKERS_INCLUDE?.replaceAll(/\s/g, '');
  const excludedWorkers = process.env.IMMICH_WORKERS_EXCLUDE?.replaceAll(/\s/g, '');

  if (includedWorkers) {
    workers = includedWorkers.split(',');
  }

  if (excludedWorkers) {
    workers = workers.filter((worker) => !excludedWorkers.split(',').includes(worker));
  }

  if (workers.some((worker) => !WORKER_TYPES.has(worker))) {
    throw new Error(`Invalid worker(s) found: ${workers}`);
  }

  return workers;
};
