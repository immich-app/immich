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
      announcementBar: {
        id: 'site_announcement_immich',
        content: `⚠️ The project is under <strong>very active</strong> development. Expect bugs and changes. Do not use it as <strong>the only way</strong> to store your photos and videos!`,
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
          className: 'rounded-none',
        },
        items: [
          {
            type: 'custom-versionSwitcher',
            position: 'right',
          },
          {
            to: '/docs/overview/introduction',
            position: 'right',
            label: 'Docs',
          },
          {
            to: '/roadmap',
            position: 'right',
            label: 'Roadmap',
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
            href: 'https://discord.immich.app',
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
              {
                label: 'Contributing',
                to: '/docs/overview/support-the-project',
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
                to: '/roadmap',
              },
              {
                label: 'API',
                to: '/docs/api',
              },
              {
                label: 'Cursed Knowledge',
                to: '/cursed-knowledge',
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
