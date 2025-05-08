export const retry = <R, A>(
  fn: (arg: A) => R,
  interval: number = 10,
  timeout: number = 1000,
): ((args: A) => Promise<R | null>) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (args: A): Promise<R | null> => {
    if (timer) {
      clearTimeout(timer);
    }

    return new Promise<R | null>((resolve) => {
      const start = Date.now();

      const attempt = () => {
        const result = fn(args);
        if (result) {
          resolve(result);
        } else if (Date.now() - start > timeout) {
          resolve(null);
        } else {
          timer = setTimeout(attempt, interval);
        }
      };

      attempt();
    });
  };
};
