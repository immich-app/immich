import { SystemConfig } from 'src/config';
import { DeepPartial } from 'src/types';

export const systemConfigStub = {
  enabled: {
    oauth: {
      enabled: true,
      autoRegister: true,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  disabled: {
    passwordLogin: {
      enabled: false,
    },
  },
  oauthEnabled: {
    oauth: {
      enabled: true,
      autoRegister: false,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  oauthWithAutoRegister: {
    oauth: {
      enabled: true,
      autoRegister: true,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  oauthWithMobileOverride: {
    oauth: {
      enabled: true,
      autoRegister: true,
      mobileOverrideEnabled: true,
      mobileRedirectUri: 'http://mobile-redirect',
      buttonText: 'OAuth',
    },
  },
  oauthWithStorageQuota: {
    oauth: {
      enabled: true,
      autoRegister: true,
      defaultStorageQuota: 1,
    },
  },
  deleteDelay30: {
    user: {
      deleteDelay: 30,
    },
  },
  libraryWatchEnabled: {
    library: {
      scan: {
        enabled: false,
      },
      watch: {
        enabled: true,
      },
    },
  },
  libraryWatchDisabled: {
    library: {
      scan: {
        enabled: false,
      },
      watch: {
        enabled: false,
      },
    },
  },
  libraryScan: {
    library: {
      scan: {
        enabled: true,
        cronExpression: '0 0 * * *',
      },
      watch: {
        enabled: false,
      },
    },
  },
  libraryScanAndWatch: {
    library: {
      scan: {
        enabled: true,
        cronExpression: '0 0 * * *',
      },
      watch: {
        enabled: true,
      },
    },
  },
  backupEnabled: {
    backup: {
      database: {
        enabled: true,
        cronExpression: '0 0 * * *',
        keepLastAmount: 1,
      },
    },
  },
  machineLearningDisabled: {
    machineLearning: {
      enabled: false,
    },
  },
  machineLearningEnabled: {
    machineLearning: {
      enabled: true,
      clip: {
        modelName: 'ViT-B-16__openai',
        enabled: true,
      },
    },
  },
  publicUsersDisabled: {
    server: {
      publicUsers: false,
    },
  },
} satisfies Record<string, DeepPartial<SystemConfig>>;
