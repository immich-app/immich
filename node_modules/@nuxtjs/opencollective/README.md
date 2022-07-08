# @nuxt/opencollective 🤝 Pretty opencollective stats on postinstall!
[![npm version][npm-v-src]][npm-v-href]
[![npm downloads][npm-d-src]][npm-d-href]
[![status][github-actions-src]][github-actions-href]

![Showcase](https://i.imgur.com/PZqyT3x.jpg)

>

[📖 **Release Notes**](./CHANGELOG.md)

## Features

Displaying **opencollective** statistics and a donation URL after users install a package
is important for many creators. After problems with current packages that offer similar
features, we decided to spin off our one own. Our key goals are:

* No interference/problems when installing packages. Never break installation because of the package
* Pretty output for all information
* Decent configurability
* Seamless drop-in for [common](https://github.com/opencollective/opencollective-cli) [solutions](https://github.com/opencollective/opencollective-postinstall)

## Setup

- Add `@nuxt/opencollective` dependency using yarn or npm to your project
- Add the script to `postinstall` in your package.json

```js
{
  // ...
  "scripts": {
    "postinstall": "opencollective || exit 0"
  },
  "collective": {
    "url": "https://opencollective.com/nuxtjs"
  }
  // ...
}
```

- Configure it

## Configuration

Configuration is applied through your project's `package.json`.

A full configuration looks like:

```json
{
  "collective": {
    "url": "https://opencollective.com/nuxtjs",
    "logoUrl": "https://opencollective.com/nuxtjs/logo.txt?reverse=true&variant=variant2",
    "donation": {
      "slug": "/order/591",
      "amount": "50",
      "text": "Please donate:"
    }
  }
}
```

---

| Attribute | Optional | Default | Comment |
| ---    |   ---   | ---   | --- |
| url | ❌  | - | The URL to your opencollective page
| logo | ✅  | - | **LEGACY**: The URL to the logo that should be displayed. Please use `logoUrl` instead.
| logoUrl | ✅  | - | The URL to the ASCII-logo that should be displayed.
| donation.slug | ✅  | '/donate' | The slug that should be appended to `url`. Can be used to setup a specific order.
| donation.amount | ✅  | - | The default amount that should be selected on the opencollective page.
| donation.text | ✅  | 'Donate:' | The text that will be displayed before your donation url.

## Disable message

We know the postinstall messages can be annoying when deploying in
production or running a CI pipeline. That's why the message is
**disabled** in those environments by default.

**Enabled** when one the following environment variables is set:

* `NODE_ENV=dev`
* `NODE_ENV=development`
* `OPENCOLLECTIVE_FORCE`

**Strictly Disabled** when one the following environment variables is set:

- `OC_POSTINSTALL_TEST`
- `OPENCOLLECTIVE_HIDE`
- `CI`
- `CONTINUOUS_INTEGRATION`
- `NODE_ENV` (set and **not** `dev` or `development`)
- `DISABLE_OPENCOLLECTIVE` (set to any string value that is not `'false'` or `'0'`,
  for compatability with
  [opencollective-postinatall](https://github.com/opencollective/opencollective-postinstall))

## Development

- Clone this repository
- Install dependencies using `yarn install` or `npm install`
- Run it manually `path/to/project/root/src/index.js path/to/package/you/want/to/try`
- Run tests with `npm t` or `yarn test`

## Inspiration

This project is heavily inspired by [opencollective-cli](https://github.com/opencollective/opencollective-cli).

## License

[MIT License](./LICENSE)
MIT. Made with 💖

<!-- Refs -->
[npm-v-src]: https://img.shields.io/npm/v/@nuxt/opencollective?style=flat-square
[npm-v-href]: https://npmjs.com/package/@nuxt/opencollective

[npm-d-src]: https://img.shields.io/npm/dm/@nuxt/opencollective?style=flat-square
[npm-d-href]: https://npmjs.com/package/@nuxt/opencollective

[github-actions-src]: https://img.shields.io/github/workflow/status/nuxt-contrib/opencollective/ci/master?style=flat-square
[github-actions-href]: https://github.com/nuxt-contrib/opencollective/actions?query=workflow%3Aci
