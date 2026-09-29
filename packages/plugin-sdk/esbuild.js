import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  outdir: 'dist',
  bundle: true,
  sourcemap: false,
  minify: false,
  format: 'esm',
  platform: 'node',
  target: ['es2020'],
});
