import pannellumCssUrl from 'pannellum/build/pannellum.css?url';
import pannellumScriptUrl from 'pannellum/build/pannellum.js?url';

let loadPromise: Promise<void> | undefined;

/** Loads Pannellum's UMD build (attaches window.pannellum) via a real <script>/<link> tag, since
 * the npm package has no ES module build - matches how the library is meant to be consumed.
 * Safe to call multiple times; the script is only ever injected once. */
export function loadPannellum(): Promise<void> {
  if (typeof pannellum !== 'undefined') {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = pannellumCssUrl;
      document.head.append(link);

      const script = document.createElement('script');
      script.src = pannellumScriptUrl;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Failed to load pannellum')));
      document.head.append(script);
    });
  }
  return loadPromise;
}
