import { getContentDisposition } from 'src/utils/file.js';

describe('getContentDisposition', () => {
  it('should encode a plain filename', () => {
    expect(getContentDisposition('attachment', 'archive.zip')).toBe("attachment; filename*=UTF-8''archive.zip");
  });

  it('should percent-encode spaces and non-ASCII characters', () => {
    expect(getContentDisposition('inline', 'Café 2024.jpg')).toBe("inline; filename*=UTF-8''Caf%C3%A9%202024.jpg");
  });

  it('should percent-encode characters that are not valid RFC 8187 attr-chars', () => {
    const header = getContentDisposition('attachment', "Sam's (birthday) *party*.zip");
    expect(header).toBe("attachment; filename*=UTF-8''Sam%27s%20%28birthday%29%20%2Aparty%2A.zip");
    // the only apostrophes left are the two charset/language delimiters
    expect(header.split("'")).toHaveLength(3);
  });
});
