// Must be imported before eslint-plugin-svelte / svelte-eslint-parser.
// Enables svelte-eslint-parser's ts.sys hook so typescript-eslint can reuse
// its TypeScript program across .svelte files instead of rebuilding it per
// file (~4x faster lint). See https://github.com/sveltejs/eslint-plugin-svelte/issues/1552
process.env.SVELTE_ESLINT_PARSER_EXPERIMENTAL_TS_SYS_HOOK ??= '1';
