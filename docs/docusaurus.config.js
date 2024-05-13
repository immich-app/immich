// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const prism = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Immich',
  tagline: 'High performance self-hosted photo and video backup solution directly from your mobile phone',
  url: 'https://immich.app',
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
      'docusaurus-preset-openapi',
      /** @type {import('docusaurus-preset-openapi').Options} */
      ({
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,

          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/immich-app/immich/tree/main/docs/',
        },
        api: {
          path: '../open-api/immich-openapi-specs.json',
          routeBasePath: '/docs/api',
        },
        // blog: {
        //   showReadingTime: true,
        //   editUrl: "https://github.com/immich-app/immich/tree/main/docs/",
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
      },
      announcementBar: {
        id: 'site_announcement_immich',
        content: `⚠️ The project is under <strong>very active</strong> development. Expect bugs and changes. Do not use it as <strong>the only way</strong> to store your photos and videos!`,
        backgroundColor: '#593f00',
        textColor: '#ffefc9',
        isCloseable: false,
      },
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
        },
        items: [
          {
            to: '/docs/overview/introduction',
            position: 'right',
            label: 'Docs',
          },
          {
            to: '/milestones',
            position: 'right',
            label: 'Milestones',
          },
          {
            to: '/docs/api',
            position: 'right',
            label: 'API',
          },
          {
            to: '/blog',
            position: 'right',
            label: 'Blog',
          },
          {
            href: 'https://github.com/immich-app/immich',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://discord.gg/D8JsnBEuKb',
            label: 'Discord',
            position: 'right',
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
                label: 'Welcome',
                to: '/docs/overview/introduction',
              },
              {
                label: 'Installation',
                to: '/docs/install/requirements',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.com/invite/D8JsnBEuKb',
              },
              {
                label: 'Reddit',
                href: 'https://www.reddit.com/r/immich/',
              },
            ],
          },
          {
            title: 'Links',
            items: [
              // {
              //   label: "Blog",
              //   to: "/blog",
              // },
              {
                label: 'GitHub',
                href: 'https://github.com/immich-app/immich',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/@immich-app',
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
      image: 'overview/img/feature-panel.png',
    }),
};

module.exports = config;
