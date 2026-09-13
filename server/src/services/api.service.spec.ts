import { ApiService, render, renderBasePath } from 'src/services/api.service.js';

describe(ApiService.name, () => {
  describe('renderBasePath', () => {
    const index = `
      <script>globalThis.__IMMICH_BASE_PATH__ = '__IMMICH_BASE_PATH__';</script>
      <script>globalThis.__sveltekit = { base: "" };</script>
      <link href="/_app/app.css" />
      <script src="/_app/app.js"></script>
      <script>
        import("/_app/start.js");
        const script_url = '/service-worker.js';
      </script>`;

    it('renders a configured base path', () => {
      const output = renderBasePath(index, '/immich');

      expect(output).toContain(`globalThis.__IMMICH_BASE_PATH__ = "/immich"`);
      expect(output).toContain(`globalThis.__sveltekit = { base: "/immich" }`);
      expect(output).toContain('href="/immich/_app/app.css"');
      expect(output).toContain('src="/immich/_app/app.js"');
      expect(output).toContain('import("/immich/_app/start.js")');
      expect(output).toContain("const script_url = '/immich/service-worker.js'");
    });

    it('keeps root deployments unchanged', () => {
      const output = renderBasePath(index, '');

      expect(output).toContain(`globalThis.__IMMICH_BASE_PATH__ = ""`);
      expect(output).toContain(`globalThis.__sveltekit = { base: "" }`);
      expect(output).toContain('href="/_app/app.css"');
      expect(output).toContain('src="/_app/app.js"');
      expect(output).toContain('import("/_app/start.js")');
      expect(output).toContain("const script_url = '/service-worker.js'");
    });
  });

  describe('render', () => {
    it('should correctly render open graph tags', () => {
      const output = render('<!-- metadata:tags -->', {
        title: 'title',
        description: 'description',
        imageUrl: 'https://demo.immich.app/api/assets/123',
      });
      expect(output).toContain('<meta property="og:title" content="title" />');
      expect(output).toContain('<meta property="og:description" content="description" />');
      expect(output).toContain('<meta property="og:image" content="https://demo.immich.app/api/assets/123" />');
    });

    it('should escape html tags', () => {
      expect(
        render('<!-- metadata:tags -->', {
          title: "<script>console.log('hello')</script>Test",
          description: 'description',
        }),
      ).toContain(
        '<meta property="og:title" content="&lt;script&gt;console.log(&#39;hello&#39;)&lt;/script&gt;Test" />',
      );
    });

    it('should escape quotes', () => {
      expect(
        render('<!-- metadata:tags -->', {
          title: `0;url=https://example.com" http-equiv="refresh`,
          description: 'description',
        }),
      ).toContain('<meta property="og:title" content="0;url=https://example.com&quot; http-equiv=&quot;refresh" />');
    });
  });
});
