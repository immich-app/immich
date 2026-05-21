import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  sourcemap: false,
  minify: false,
  format: 'esm',
  target: ['es2020'],
});
