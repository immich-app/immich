import { ApiService, render } from 'src/services/api.service';

describe(ApiService.name, () => {
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
