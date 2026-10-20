import { replaceTemplateTags, templatePreview } from 'src/utils/replace-template-tags.js';

describe(replaceTemplateTags.name, () => {
  it('should replace tags', () => {
    expect(replaceTemplateTags('Hello {name}, welcome to {instance}', { name: 'Alan', instance: 'Immich' })).toBe(
      'Hello Alan, welcome to Immich',
    );
  });

  it('should leave unknown tags untouched', () => {
    expect(replaceTemplateTags('Hello {name} {unknown}', { name: 'Alan' })).toBe('Hello Alan {unknown}');
  });

  it('should escape html in values', () => {
    expect(
      replaceTemplateTags('<p>{name} shared {album}</p>', {
        name: '<img src=x onerror="alert(1)">',
        album: '</p><a href="https://example.com">x</a><p>',
      }),
    ).toBe(
      '<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt; shared &lt;/p&gt;&lt;a href=&quot;https://example.com&quot;&gt;x&lt;/a&gt;&lt;p&gt;</p>',
    );
  });

  it('should not escape html when disabled', () => {
    expect(replaceTemplateTags('{name}', { name: '<b>Alan</b>' }, { escapeHtml: false })).toBe('<b>Alan</b>');
  });
});

describe(templatePreview.name, () => {
  it('should produce plain text with unescaped values', () => {
    expect(templatePreview('<p>Hey <strong>{name}</strong>!</p>', { name: "Tom & Jerry O'Brien" })).toBe(
      "Hey Tom & Jerry O'Brien!",
    );
  });

  it('should strip tags that came from values', () => {
    expect(templatePreview('<p>{name}</p>', { name: '<a href="https://example.com">click</a>' })).toBe('click');
  });
});
