---
sidebar_position: 3
---

# Contributing

Contributions are welcome!

## PR Checklist

When contributing code through a pull request, please check the following:

### Web Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check` (Type checking via SvelteKit)
- [ ] `npm test` (Tests via Jest)

:::tip
Run all web checks with `npm run check:all`
:::

### Server Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check` (Type checking via `tsc`)
- [ ] `npm test` (Tests via Jest)

:::tip
Run all server checks with `npm run check:all`
:::

### Open API

The Open API client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file.

- [ ] `npm run api:generate`

:::tip
This can also be run via `make api` from the project root directory (not in the `server` folder)
:::
