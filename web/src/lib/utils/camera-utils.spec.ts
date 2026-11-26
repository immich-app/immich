import { getCameraName } from '#lib/utils/camera-utils.ts';

describe('getCameraName', () => {
  it('should not repeat the make when the model already starts with it', () => {
    expect(getCameraName('Canon', 'Canon EOS R6m2')).toBe('Canon EOS R6m2');
    expect(getCameraName('Canon', 'Canon EOS 5D Mark IV')).toBe('Canon EOS 5D Mark IV');
  });

  it('should compare the make and model case-insensitively', () => {
    expect(getCameraName('NIKON', 'Nikon Z 6')).toBe('Nikon Z 6');
    expect(getCameraName('canon', 'CANON EOS R5')).toBe('CANON EOS R5');
  });

  it('should compare against the first word of a multi-word make', () => {
    expect(getCameraName('NIKON CORPORATION', 'NIKON D850')).toBe('NIKON D850');
    expect(getCameraName('OLYMPUS IMAGING CORP.', 'OLYMPUS E-M1')).toBe('OLYMPUS E-M1');
  });

  it('should match any word of a multi-word make', () => {
    expect(getCameraName('EASTMAN KODAK COMPANY', 'KODAK EASYSHARE C875')).toBe('KODAK EASYSHARE C875');
    expect(getCameraName('EASTMAN KODAK COMPANY', 'EASTMAN KODAK 1')).toBe('EASTMAN KODAK 1');
  });

  it('should prepend the make when the model does not include it', () => {
    expect(getCameraName('SONY', 'ILCE-7M4')).toBe('SONY ILCE-7M4');
    expect(getCameraName('FUJIFILM', 'X-T5')).toBe('FUJIFILM X-T5');
    expect(getCameraName('Apple', 'iPhone 15 Pro')).toBe('Apple iPhone 15 Pro');
  });

  it('should only treat the make as a prefix on a word boundary', () => {
    expect(getCameraName('Canon', 'Canonical X1')).toBe('Canon Canonical X1');
  });

  it('should handle a missing make or model', () => {
    expect(getCameraName('Canon', null)).toBe('Canon');
    expect(getCameraName(undefined, 'EOS R6m2')).toBe('EOS R6m2');
    expect(getCameraName(null, null)).toBe('');
    expect(getCameraName('', '')).toBe('');
  });

  it('should ignore surrounding whitespace', () => {
    expect(getCameraName(' Canon ', ' Canon EOS R6m2 ')).toBe('Canon EOS R6m2');
  });
});
