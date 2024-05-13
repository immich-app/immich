# PR Checklist

When contributing code through a pull request, please check the following:

## Web Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check:svelte` (Type checking via SvelteKit)
- [ ] `npm test` (unit tests)

## Documentation

- [ ] `npm run format` (formatting via Prettier)
- [ ] Update the `_redirects` file if you have renamed a page or removed it from the documentation.

:::tip AIO
Run all web checks with `npm run check:all`
:::

## Server Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check` (Type checking via `tsc`)
- [ ] `npm test` (unit tests)

:::tip AIO
Run all server checks with `npm run check:all`
:::

:::info Auto Fix
You can use `npm run __:fix` to potentially correct some issues automatically for `npm run format` and `lint`.
:::

## OpenAPI

The OpenAPI client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file. Note that you should not modify this file directly as it is auto-generated. See [OpenAPI](/docs/developer/open-api.md) for more details.

## Database Migrations

A database migration needs to be generated whenever there are changes to `server/src/infra/src/entities`. See [Database Migration](/docs/developer/database-migrations.md) for more details.
