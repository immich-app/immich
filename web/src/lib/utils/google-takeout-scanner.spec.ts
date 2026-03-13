import type { ScanProgress, ScanResult } from '$lib/utils/google-takeout-scanner';

/**
 * Helper to create a zip blob in memory using zip.js.
 * Each entry is { path: string, content: string }.
 */
async function createZipBlob(entries: { path: string; content: string }[]): Promise<Blob> {
  const { BlobWriter, ZipWriter, TextReader } = await import('@zip.js/zip.js');
  const blobWriter = new BlobWriter('application/zip');
  const zipWriter = new ZipWriter(blobWriter);

  for (const entry of entries) {
    await zipWriter.add(entry.path, new TextReader(entry.content));
  }

  await zipWriter.close();
  return blobWriter.getData();
}

function makeSidecar(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    title: 'IMG_001.jpg',
    photoTakenTime: { timestamp: '1609459200' },
    geoData: { latitude: 48.8566, longitude: 2.3522 },
    favorited: true,
    archived: false,
    ...overrides,
  });
}

function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: 'application/zip' });
}

describe('scanTakeoutFiles', () => {
  // Dynamically import to avoid issues with module resolution in tests
  let scanTakeoutFiles: typeof import('$lib/utils/google-takeout-scanner').scanTakeoutFiles;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-scanner');
    scanTakeoutFiles = mod.scanTakeoutFiles;
  });

  it('should scan a zip and extract media with metadata', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg', content: 'fake-image-data' },
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const result: ScanResult = await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout-001.zip')],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_001.jpg');
    expect(result.items[0].metadata).toBeDefined();
    expect(result.items[0].metadata!.title).toBe('IMG_001.jpg');
    expect(result.items[0].metadata!.latitude).toBe(48.8566);
    expect(result.items[0].metadata!.isFavorite).toBe(true);
    expect(result.stats.totalMedia).toBe(1);
    expect(result.stats.withLocation).toBe(1);
    expect(result.stats.withDate).toBe(1);
    expect(result.stats.favorites).toBe(1);
    expect(result.stats.archived).toBe(0);
  });

  it('should report progress via callback', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/Album/IMG_001.jpg', content: 'fake-image-data' },
      { path: 'Takeout/Google Photos/Album/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const progressUpdates: ScanProgress[] = [];
    await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout-001.zip')],
      onProgress: (p) => progressUpdates.push({ ...p, albumNames: new Set(p.albumNames) }),
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    const lastProgress = progressUpdates.at(-1)!;
    expect(lastProgress.zipCount).toBe(1);
    expect(lastProgress.zipIndex).toBe(0);
    expect(lastProgress.mediaCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle items without sidecar', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_002.jpg', content: 'fake-image-data' },
    ]);

    const result = await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout-001.zip')],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_002.jpg');
    expect(result.items[0].metadata).toBeUndefined();
    expect(result.stats.withLocation).toBe(0);
    expect(result.stats.withDate).toBe(0);
  });

  it('should merge results from multiple zips', async () => {
    const zip1 = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg', content: 'fake-image-1' },
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg.json', content: makeSidecar({ title: 'IMG_001.jpg' }) },
    ]);
    const zip2 = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_002.jpg', content: 'fake-image-2' },
      {
        path: 'Takeout/Google Photos/Trip/IMG_002.jpg.json',
        content: makeSidecar({ title: 'IMG_002.jpg', photoTakenTime: { timestamp: '1609545600' } }),
      },
    ]);

    const result = await scanTakeoutFiles({
      files: [blobToFile(zip1, 'takeout-001.zip'), blobToFile(zip2, 'takeout-002.zip')],
    });

    expect(result.items).toHaveLength(2);
    expect(result.stats.totalMedia).toBe(2);
    expect(result.stats.withLocation).toBe(2);
    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].name).toBe('Trip');
    expect(result.albums[0].itemCount).toBe(2);
  });

  it('should skip non-media files', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg', content: 'fake-image' },
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg.json', content: makeSidecar() },
      { path: 'Takeout/Google Photos/Trip/metadata.json', content: '{"some":"metadata"}' },
      { path: 'Takeout/Google Photos/Trip/print-subscriptions.json', content: '{}' },
      { path: 'Takeout/Google Photos/Trip/shared_album_comments.json', content: '{}' },
      { path: 'Takeout/Google Photos/Trip/user-generated-memory-titles.json', content: '{}' },
    ]);

    const result = await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout-001.zip')],
    });

    // Only IMG_001.jpg should be a media item — all the standalone JSON files are skipped
    expect(result.items).toHaveLength(1);
    expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_001.jpg');
  });

  it('should handle zip with many interleaved sidecars and media files', async () => {
    const entries: { path: string; content: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = `IMG_${String(i).padStart(3, '0')}.jpg`;
      const album = i <= 10 ? 'Album1' : 'Album2';
      entries.push(
        {
          path: `Takeout/Google Photos/${album}/${name}.json`,
          content: makeSidecar({
            title: name,
            photoTakenTime: { timestamp: String(1_609_459_200 + i * 86_400) },
            geoData: { latitude: 48 + i * 0.01, longitude: 2 + i * 0.01 },
          }),
        },
        {
          path: `Takeout/Google Photos/${album}/${name}`,
          content: `fake-image-data-${i}`,
        },
      );
    }

    const zipBlob = await createZipBlob(entries);
    const result = await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout-large.zip')],
    });

    expect(result.items).toHaveLength(20);
    expect(result.stats.totalMedia).toBe(20);
    expect(result.stats.withLocation).toBe(20);
    expect(result.stats.withDate).toBe(20);
    expect(result.albums).toHaveLength(2);
    for (const item of result.items) {
      expect(item.metadata).toBeDefined();
      expect(item.metadata!.latitude).toBeDefined();
      expect(item.metadata!.dateTaken).toBeDefined();
    }
  });

  it('should support abort signal', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg', content: 'fake-image' },
      { path: 'Takeout/Google Photos/Trip/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const controller = new AbortController();
    // Abort immediately
    controller.abort();

    await expect(
      scanTakeoutFiles({
        files: [blobToFile(zipBlob, 'takeout-001.zip')],
        signal: controller.signal,
      }),
    ).rejects.toThrow();
  });
});

function createFileWithPath(content: string, name: string, relativePath: string, type?: string): File {
  const file = new File([content], name, { type: type ?? 'application/octet-stream' });
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });
  return file;
}

describe('scanTakeoutFiles — folder support', () => {
  let scanTakeoutFiles: typeof import('$lib/utils/google-takeout-scanner').scanTakeoutFiles;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-scanner');
    scanTakeoutFiles = mod.scanTakeoutFiles;
  });

  it('should scan folder files with webkitRelativePath', async () => {
    const files = [
      createFileWithPath('fake-image', 'IMG_001.jpg', 'Takeout/Google Photos/Trip/IMG_001.jpg', 'image/jpeg'),
      createFileWithPath(
        makeSidecar(),
        'IMG_001.jpg.json',
        'Takeout/Google Photos/Trip/IMG_001.jpg.json',
        'application/json',
      ),
    ];

    const result: ScanResult = await scanTakeoutFiles({ files });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].file.name).toBe('IMG_001.jpg');
    expect(result.items[0].metadata).toBeDefined();
    expect(result.items[0].metadata!.title).toBe('IMG_001.jpg');
    expect(result.items[0].metadata!.latitude).toBe(48.8566);
    expect(result.stats.totalMedia).toBe(1);
    expect(result.stats.withLocation).toBe(1);
  });

  it('should match JSON sidecars from the same folder', async () => {
    const files = [
      createFileWithPath('fake-image-1', 'IMG_001.jpg', 'Takeout/Google Photos/Trip/IMG_001.jpg', 'image/jpeg'),
      createFileWithPath(
        makeSidecar({ title: 'IMG_001.jpg', favorited: true }),
        'IMG_001.jpg.json',
        'Takeout/Google Photos/Trip/IMG_001.jpg.json',
        'application/json',
      ),
      createFileWithPath('fake-image-2', 'IMG_002.jpg', 'Takeout/Google Photos/Trip/IMG_002.jpg', 'image/jpeg'),
      // No sidecar for IMG_002
    ];

    const result = await scanTakeoutFiles({ files });

    expect(result.items).toHaveLength(2);
    const itemWithMeta = result.items.find((i) => i.metadata);
    const itemWithout = result.items.find((i) => !i.metadata);
    expect(itemWithMeta).toBeDefined();
    expect(itemWithMeta!.metadata!.isFavorite).toBe(true);
    expect(itemWithout).toBeDefined();
    expect(itemWithout!.file.name).toBe('IMG_002.jpg');
  });

  it('should detect albums from folder hierarchy', async () => {
    const files = [
      createFileWithPath('img-1', 'IMG_001.jpg', 'Takeout/Google Photos/Trip/IMG_001.jpg', 'image/jpeg'),
      createFileWithPath(makeSidecar(), 'IMG_001.jpg.json', 'Takeout/Google Photos/Trip/IMG_001.jpg.json'),
      createFileWithPath('img-2', 'IMG_002.jpg', 'Takeout/Google Photos/Vacation/IMG_002.jpg', 'image/jpeg'),
      createFileWithPath(
        makeSidecar({ title: 'IMG_002.jpg' }),
        'IMG_002.jpg.json',
        'Takeout/Google Photos/Vacation/IMG_002.jpg.json',
      ),
    ];

    const result = await scanTakeoutFiles({ files });

    expect(result.albums).toHaveLength(2);
    const albumNames = result.albums.map((a) => a.name).sort();
    expect(albumNames).toEqual(['Trip', 'Vacation']);
  });

  it('should handle mix of zip and folder files', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/ZipAlbum/IMG_ZIP.jpg', content: 'zip-image' },
      { path: 'Takeout/Google Photos/ZipAlbum/IMG_ZIP.jpg.json', content: makeSidecar({ title: 'IMG_ZIP.jpg' }) },
    ]);
    const zipFile = blobToFile(zipBlob, 'takeout-001.zip');

    const folderFile = createFileWithPath(
      'folder-image',
      'IMG_FOLDER.jpg',
      'Takeout/Google Photos/FolderAlbum/IMG_FOLDER.jpg',
      'image/jpeg',
    );

    const result = await scanTakeoutFiles({ files: [zipFile, folderFile] });

    expect(result.items).toHaveLength(2);
    expect(result.albums.map((a) => a.name).sort()).toEqual(['FolderAlbum', 'ZipAlbum']);
  });
});
