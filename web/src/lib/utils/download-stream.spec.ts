import { describe, expect, it, vi } from 'vitest';
import {
  isSafariBrowser,
  shouldPreferStreamingDownload,
  supportsFileSystemAccessDownload,
} from './download-stream';

describe('download-stream helpers', () => {
  it('shouldPreferStreamingDownload on Safari user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });
    expect(isSafariBrowser()).toBe(true);
    expect(shouldPreferStreamingDownload(1024)).toBe(true);
    vi.unstubAllGlobals();
  });

  it('shouldPreferStreamingDownload for large archives on non-Safari', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    expect(isSafariBrowser()).toBe(false);
    expect(shouldPreferStreamingDownload(500 * 1024 * 1024)).toBe(true);
    expect(shouldPreferStreamingDownload(100 * 1024 * 1024)).toBe(false);
    vi.unstubAllGlobals();
  });

  it('supportsFileSystemAccessDownload reflects showSaveFilePicker', () => {
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn() });
    expect(supportsFileSystemAccessDownload()).toBe(true);
    vi.stubGlobal('window', {});
    expect(supportsFileSystemAccessDownload()).toBe(false);
    vi.unstubAllGlobals();
  });
});
