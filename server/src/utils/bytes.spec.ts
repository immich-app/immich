import { asHumanReadable, hexOrBufferToBase64, HumanReadableSize } from 'src/utils/bytes';
import { describe, expect, it } from 'vitest';

describe('asHumanReadable', () => {
  it('should format 0 bytes', () => {
    expect(asHumanReadable(0)).toBe('0 B');
  });

  it('should format bytes below 1 KiB without decimals', () => {
    expect(asHumanReadable(1)).toBe('1 B');
    expect(asHumanReadable(512)).toBe('512 B');
    expect(asHumanReadable(1023)).toBe('1023 B');
  });

  it('should format exactly 1 KiB', () => {
    expect(asHumanReadable(1024)).toBe('1.0 KiB');
  });

  it('should format values in KiB range', () => {
    expect(asHumanReadable(1536)).toBe('1.5 KiB');
    expect(asHumanReadable(10 * 1024)).toBe('10.0 KiB');
  });

  it('should format exactly 1 MiB', () => {
    expect(asHumanReadable(HumanReadableSize.MiB)).toBe('1.0 MiB');
  });

  it('should format values in MiB range', () => {
    expect(asHumanReadable(1.5 * HumanReadableSize.MiB)).toBe('1.5 MiB');
    expect(asHumanReadable(100 * HumanReadableSize.MiB)).toBe('100.0 MiB');
  });

  it('should format exactly 1 GiB', () => {
    expect(asHumanReadable(HumanReadableSize.GiB)).toBe('1.0 GiB');
  });

  it('should format values in GiB range', () => {
    expect(asHumanReadable(2.5 * HumanReadableSize.GiB)).toBe('2.5 GiB');
  });

  it('should format exactly 1 TiB', () => {
    expect(asHumanReadable(HumanReadableSize.TiB)).toBe('1.0 TiB');
  });

  it('should format values in TiB range', () => {
    expect(asHumanReadable(3.7 * HumanReadableSize.TiB)).toBe('3.7 TiB');
  });

  it('should format exactly 1 PiB', () => {
    expect(asHumanReadable(HumanReadableSize.PiB)).toBe('1.0 PiB');
  });

  it('should respect custom precision', () => {
    expect(asHumanReadable(1536, 2)).toBe('1.50 KiB');
    expect(asHumanReadable(1536, 0)).toBe('2 KiB');
    expect(asHumanReadable(1.234 * HumanReadableSize.GiB, 3)).toBe('1.234 GiB');
  });

  it('should use 0 decimals for byte values regardless of precision', () => {
    expect(asHumanReadable(512, 3)).toBe('512 B');
  });

  it('should not exceed the EiB unit', () => {
    // 1 EiB = 1024 PiB
    const oneEiB = HumanReadableSize.PiB * 1024;
    expect(asHumanReadable(oneEiB)).toBe('1.0 EiB');
  });

  it('should stay at EiB for extremely large values', () => {
    const twoEiB = HumanReadableSize.PiB * 2048;
    expect(asHumanReadable(twoEiB)).toBe('2.0 EiB');
  });
});

describe('hexOrBufferToBase64', () => {
  it(String.raw`should convert a hex-encoded string (with \x prefix) to base64`, () => {
    // "hello" in hex is 68656c6c6f
    const hex = String.raw`\x68656c6c6f`;
    const result = hexOrBufferToBase64(hex);

    expect(result).toBe(Buffer.from('hello').toString('base64'));
  });

  it('should convert a Buffer to base64', () => {
    const buffer = Buffer.from('hello');
    const result = hexOrBufferToBase64(buffer);

    expect(result).toBe(Buffer.from('hello').toString('base64'));
  });

  it('should handle an empty hex string', () => {
    const hex = String.raw`\x`;
    const result = hexOrBufferToBase64(hex);

    expect(result).toBe('');
  });

  it('should handle an empty Buffer', () => {
    const buffer = Buffer.alloc(0);
    const result = hexOrBufferToBase64(buffer);

    expect(result).toBe('');
  });

  it('should produce consistent results for hex string and equivalent Buffer', () => {
    const data = 'test data 123';
    const hexString = String.raw`\x` + Buffer.from(data).toString('hex');
    const buffer = Buffer.from(data);

    expect(hexOrBufferToBase64(hexString)).toBe(hexOrBufferToBase64(buffer));
  });

  it('should handle binary data in hex format', () => {
    // Binary bytes 0x00, 0xFF, 0x80
    const hex = String.raw`\x00ff80`;
    const result = hexOrBufferToBase64(hex);

    const expected = Buffer.from([0x00, 0xff, 0x80]).toString('base64');
    expect(result).toBe(expected);
  });

  it('should handle binary data in Buffer format', () => {
    const buffer = Buffer.from([0x00, 0xff, 0x80]);
    const result = hexOrBufferToBase64(buffer);

    expect(result).toBe(buffer.toString('base64'));
  });
});
