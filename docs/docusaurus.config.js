// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const prism = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Gallery',
  tagline: 'Self-hosted photo and video management solution',
  url: 'https://docs.opennoodle.de',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',

  organizationName: 'open-noodle',
  projectName: 'gallery',
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
          editUrl: 'https://github.com/open-noodle/gallery/tree/main/docs/',
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
          alt: 'Gallery Logo',
          src: 'img/gallery-logo-inline-light.svg',
          srcDark: 'img/gallery-logo-inline-dark.svg',
          className: 'rounded-none',
        },
        items: [
          {
            href: 'https://opennoodle.de/',
            position: 'right',
            label: 'Home',
          },
          {
            href: 'https://demo.opennoodle.de/',
            position: 'right',
            label: 'Demo',
          },
          {
            href: 'https://github.com/open-noodle/gallery',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Product',
            items: [
              {
                label: 'Home',
                href: 'https://opennoodle.de',
              },
              {
                label: 'Demo',
                href: 'https://demo.opennoodle.de',
              },
              {
                label: 'API Documentation',
                href: 'https://demo.opennoodle.de/doc',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/open-noodle/gallery',
              },
              {
                label: 'Discussions',
                href: 'https://github.com/open-noodle/gallery/discussions',
              },
            ],
          },
          {
            title: 'Upstream',
            items: [
              {
                label: 'Immich',
                href: 'https://immich.app',
              },
              {
                label: 'Immich Docs',
                href: 'https://docs.immich.app',
              },
            ],
          },
        ],
        copyright: `Gallery is a fork of Immich, available as open source under the terms of the GNU AGPL v3 License.`,
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
