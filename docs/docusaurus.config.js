// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const prism = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Immich',
  tagline: 'High performance self-hosted photo and video backup solution directly from your mobile phone',
  url: 'https://docs.immich.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'immich-app', // Usually your GitHub org/user name.
  projectName: 'immich', // Usually your repo name.
  deploymentBranch: 'main',
  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    async function myPlugin(context, options) {
      return {
        name: 'docusaurus-tailwindcss',
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          postcssOptions.plugins.push(require('tailwindcss'));
          postcssOptions.plugins.push(require('autoprefixer'));
          return postcssOptions;
        },
      };
    },
    require.resolve('docusaurus-lunr-search'),
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          routeBasePath: '/',

          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/immich-app/immich/tree/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          autoCollapseCategories: false,
        },
      },
      navbar: {
        logo: {
          alt: 'Immich Logo',
          src: 'img/immich-logo-inline-light.png',
          srcDark: 'img/immich-logo-inline-dark.png',
          className: 'rounded-none',
        },
        items: [
          {
            type: 'custom-versionSwitcher',
            position: 'right',
          },
          {
            to: '/overview/quick-start',
            position: 'right',
            label: 'Docs',
          },
          {
            href: 'https://immich.app/roadmap',
            position: 'right',
            label: 'Roadmap',
          },
          {
            href: 'https://api.immich.app/',
            position: 'right',
            label: 'API',
          },
          {
            href: 'https://immich.store',
            position: 'right',
            label: 'Merch',
          },
          {
            href: 'https://github.com/immich-app/immich',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://discord.immich.app',
            label: 'Discord',
            position: 'right',
          },
          {
            type: 'html',
            position: 'right',
            value:
              '<a href="https://buy.immich.app" target="_blank" class="no-underline hover:no-underline"><button class="buy-button bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-black rounded-xl">Buy Immich</button></a>',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Overview',
            items: [
              {
                label: 'Quick start',
                to: '/overview/quick-start',
              },
              {
                label: 'Installation',
                to: '/install/requirements',
              },
              {
                label: 'Contributing',
                to: '/overview/support-the-project',
              },
              {
                label: 'Privacy Policy',
                to: '/privacy-policy',
              },
            ],
          },
          {
            title: 'Documentation',
            items: [
              {
                label: 'Roadmap',
                href: 'https://immich.app/roadmap',
              },
              {
                label: 'API',
                href: 'https://api.immich.app/',
              },
              {
                label: 'Cursed Knowledge',
                href: 'https://immich.app/cursed-knowledge',
              },
            ],
          },
          {
            title: 'Links',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/immich-app/immich',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/@immich-app',
              },
              {
                label: 'Discord',
                href: 'https://discord.immich.app',
              },
              {
                label: 'Reddit',
                href: 'https://www.reddit.com/r/immich/',
              },
            ],
          },
        ],
        copyright: `Immich is available as open source under the terms of the GNU AGPL v3 License.`,
      },
      prism: {
        theme: prism.themes.github,
        darkTheme: prism.themes.dracula,
        additionalLanguages: ['sql', 'diff', 'bash', 'powershell', 'nginx'],
      },
      image: 'img/feature-panel.png',
    }),
};

module.exports = config;
