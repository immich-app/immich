# Development Setup

## Lint / format extensions

Setting these in the IDE give a better developer experience auto-formatting code on save and providing instant feedback on lint issues.

### VSCode
Install Prettier, ESLint and Svelte extensions.

in User `settings.json` (`cmd + shift + p` and search for Open User Settings JSON) add the following:

```json
{
  "editor.formatOnSave": true,
  "[javascript][typescript][css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2,
    "editor.formatOnSave": true
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode",
    "editor.tabSize": 2
  },
  "svelte.enable-ts-plugin": true,
  "eslint.validate": ["javascript", "svelte"]
}
```

## Running tests / checks

In both server and web:
`npm run check:all`
