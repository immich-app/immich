import { LogLevel, QueueName } from 'src/enum';

export type SystemConfig = {
  job: Record<QueueName, { concurrency: number }>;
  logging: {
    enabled: boolean;
    level: LogLevel;
  };
  passwordLogin: {
    enabled: boolean;
  };
  server: {
    externalDomain: string;
    loginPageMessage: string;
  };
  theme: {
    customCss: string;
  };
  user: {
    deleteDelay: number;
  };
};

export const defaults = Object.freeze<SystemConfig>({
  job: {
    [QueueName.BackgroundTask]: { concurrency: 5 },
  },
  logging: {
    enabled: true,
    level: LogLevel.Log,
  },
  passwordLogin: {
    enabled: true,
  },
  server: {
    externalDomain: '',
    loginPageMessage: '',
  },
  theme: {
    customCss: '',
  },
  user: {
    deleteDelay: 7,
  },
});
