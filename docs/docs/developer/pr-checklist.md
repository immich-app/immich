# PR Checklist

When contributing code through a pull request, please check the following:

## Web Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check:svelte` (Type checking via SvelteKit)
- [ ] `npm test` (unit tests)

:::tip
Run all web checks with `npm run check:all`
:::

## Server Checks

- [ ] `npm run lint` (linting via ESLint)
- [ ] `npm run format` (formatting via Prettier)
- [ ] `npm run check` (Type checking via `tsc`)
- [ ] `npm test` (unit tests)

:::tip
Run all server checks with `npm run check:all`
:::

## OpenAPI

The OpenAPI client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file. Note that you should not modify this file directly as it is auto-generated. See [OpenAPI](/docs/developer/open-api.md) for more details.

## Database Migrations

A database migration needs to be generated whenever there are changes to `server/src/infra/src/entities`. See [Database Migration](/docs/developer/database-migrations.md) for more details.
