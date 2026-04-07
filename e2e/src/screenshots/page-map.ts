/**
 * Maps URL routes to screenshot scenario keys.
 *
 * Routes discovered by the dependency analyzer are matched against this map
 * to determine which screenshot scenarios to run. Routes not in this map
 * are skipped (they don't have a scenario defined yet).
 */

export interface ScenarioDefinition {
  /** The URL path to navigate to */
  url: string;
  /** Human-readable name for the screenshot file */
  name: string;
  /** Which mock networks this scenario needs */
  mocks: ('base' | 'timeline' | 'memory')[];
  /** Optional: selector to wait for before screenshotting */
  waitForSelector?: string;
  /** Optional: time to wait after page load (ms) for animations to settle */
  settleTime?: number;
}

/**
 * Map from route paths (as output by analyze-deps) to scenario definitions.
 * A single route might map to multiple scenarios (e.g., different states).
 */
export const PAGE_SCENARIOS: Record<string, ScenarioDefinition[]> = {
  '/photos': [
    {
      url: '/photos',
      name: 'photos-timeline',
      mocks: ['base', 'timeline'],
      waitForSelector: '[data-thumbnail-focus-container]',
      settleTime: 500,
    },
  ],
  '/albums': [
    {
      url: '/albums',
      name: 'albums-list',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/explore': [
    {
      url: '/explore',
      name: 'explore',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/favorites': [
    {
      url: '/favorites',
      name: 'favorites',
      mocks: ['base', 'timeline'],
      waitForSelector: '#asset-grid',
      settleTime: 300,
    },
  ],
  '/archive': [
    {
      url: '/archive',
      name: 'archive',
      mocks: ['base', 'timeline'],
      waitForSelector: '#asset-grid',
      settleTime: 300,
    },
  ],
  '/trash': [
    {
      url: '/trash',
      name: 'trash',
      mocks: ['base', 'timeline'],
      waitForSelector: '#asset-grid',
      settleTime: 300,
    },
  ],
  '/people': [
    {
      url: '/people',
      name: 'people',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/sharing': [
    {
      url: '/sharing',
      name: 'sharing',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/search': [
    {
      url: '/search',
      name: 'search',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/memory': [
    {
      url: '/memory',
      name: 'memory',
      mocks: ['base', 'memory'],
      settleTime: 500,
    },
  ],
  '/user-settings': [
    {
      url: '/user-settings',
      name: 'user-settings',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/map': [
    {
      url: '/map',
      name: 'map',
      mocks: ['base'],
      settleTime: 500,
    },
  ],
  '/admin': [
    {
      url: '/admin',
      name: 'admin-dashboard',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/admin/system-settings': [
    {
      url: '/admin/system-settings',
      name: 'admin-system-settings',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/admin/users': [
    {
      url: '/admin/users',
      name: 'admin-users',
      mocks: ['base'],
      settleTime: 300,
    },
  ],
  '/auth/login': [
    {
      url: '/auth/login',
      name: 'login',
      mocks: [],
      settleTime: 300,
    },
  ],
  '/': [
    {
      url: '/',
      name: 'landing',
      mocks: [],
      settleTime: 300,
    },
  ],
};

/** Given a list of routes from the analyzer, return the matching scenarios. */
export function getScenariosForRoutes(routes: string[]): ScenarioDefinition[] {
  const scenarios: ScenarioDefinition[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    const defs = PAGE_SCENARIOS[route];
    if (defs) {
      for (const def of defs) {
        if (!seen.has(def.name)) {
          seen.add(def.name);
          scenarios.push(def);
        }
      }
    }
  }

  return scenarios;
}
