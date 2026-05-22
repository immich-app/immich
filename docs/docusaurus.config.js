// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const prism = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Immich',
  tagline: 'Self-hosted photo and video management solution',
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

  // Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

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
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
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
            href: 'https://immich.app/',
            position: 'right',
            label: 'Home',
          },
          {
            href: 'https://github.com/immich-app/immich',
            label: 'GitHub',
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
            title: 'Download',
            items: [
              {
                label: 'Android',
                href: 'https://get.immich.app/android',
              },
              {
                label: 'iOS',
                href: 'https://get.immich.app/ios',
              },
              {
                label: 'Server',
                href: 'https://immich.app/download',
              },
            ],
          },
          {
            title: 'Company',
            items: [
              {
                label: 'FUTO',
                href: 'https://futo.tech/',
              },
              {
                label: 'Purchase',
                href: 'https://buy.immich.app/',
              },
              {
                label: 'Merch',
                href: 'https://immich.store/',
              },
            ],
          },
          {
            title: 'Sites',
            items: [
              {
                label: 'Home',
                href: 'https://immich.app',
              },
              {
                label: 'My Immich',
                href: 'https://my.immich.app/',
              },
              {
                label: 'Awesome Immich',
                href: 'https://awesome.immich.app/',
              },
              {
                label: 'Immich API',
                href: 'https://api.immich.app/',
              },
              {
                label: 'Immich Data',
                href: 'https://data.immich.app/',
              },
              {
                label: 'Immich Datasets',
                href: 'https://datasets.immich.app/',
              },
            ],
          },
          {
            title: 'Miscellaneous',
            items: [
              {
                label: 'Roadmap',
                href: 'https://immich.app/roadmap',
              },
              {
                label: 'Cursed Knowledge',
                href: 'https://immich.app/cursed-knowledge',
              },
              {
                label: 'Privacy Policy',
                to: '/privacy-policy',
              },
            ],
          },
          {
            title: 'Social',
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
