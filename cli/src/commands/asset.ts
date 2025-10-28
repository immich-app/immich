import {
  Action,
  AssetBulkUploadCheckItem,
  AssetBulkUploadCheckResult,
  AssetMediaResponseDto,
  AssetMediaStatus,
  addAssetsToAlbum,
  checkBulkUpload,
  createAlbum,
  defaults,
  getAllAlbums,
  getSupportedMediaTypes,
} from '@immich/sdk';
import byteSize from 'byte-size';
import chokidar from 'chokidar';
import { MultiBar, Presets, SingleBar } from 'cli-progress';
import { chunk } from 'lodash-es';
import { Stats, createReadStream } from 'node:fs';
import { stat, unlink } from 'node:fs/promises';
import path, { basename } from 'node:path';
import process from 'node:process';
import picomatch from 'picomatch';
import { Queue } from 'src/queue';
import { BaseOptions, Batcher, FileHashCache, authenticate, crawl } from 'src/utils';

const UPLOAD_WATCH_BATCH_SIZE = 100;
const UPLOAD_WATCH_DEBOUNCE_TIME_MS = 10_000;

const s = (count: number) => (count === 1 ? '' : 's');

// TODO figure out why `id` is missing
type AssetBulkUploadCheckResults = Array<AssetBulkUploadCheckResult & { id: string }>;
type Asset = { id: string; filepath: string };

export interface UploadOptionsDto {
  recursive?: boolean;
  ignore?: string;
  dryRun?: boolean;
  skipHash?: boolean;
  delete?: boolean;
  album?: boolean;
  albumName?: string;
  includeHidden?: boolean;
  concurrency: number;
  progress?: boolean;
  watch?: boolean;
  jsonOutput?: boolean;
  formatAlbumNames?: boolean;
}

class UploadFile extends File {
  constructor(
    private filepath: string,
    private _size: number,
  ) {
    super([], basename(filepath));
  }

  get size() {
    return this._size;
  }

  stream() {
    return createReadStream(this.filepath) as any;
  }
}

const uploadBatch = async (files: string[], options: UploadOptionsDto, baseOptions: BaseOptions) => {
  const { newFiles, duplicates } = await checkForDuplicates(files, options, baseOptions);
  const newAssets = await uploadFiles(newFiles, options);

  if (options.jsonOutput) {
    console.log(JSON.stringify({ newFiles, duplicates, newAssets }, undefined, 4));
  }

  // Only update albums if album option is enabled
  if (options.album) {
    await updateAlbums([...newAssets, ...duplicates], options);
  }

  await deleteFiles(
    newAssets.map(({ filepath }) => filepath),
    options,
  );
};

interface WatchOptions {
  batchSize?: number;
  debounceTimeMs?: number;
}

export const startWatch = async (
  paths: string[],
  options: UploadOptionsDto,
  baseOptions: BaseOptions,
  watchOptions: WatchOptions = {},
) => {
  const { batchSize = UPLOAD_WATCH_BATCH_SIZE, debounceTimeMs = 1000 } = watchOptions;

  const { image, video } = await getSupportedMediaTypes();
  const supportedTypes = [...image, ...video];
  const matcher = picomatch(`**/*{${supportedTypes.join(',')}}`, {
    nocase: true,
    ignore: options.ignore,
  });

  const batcher = new Batcher({
    batchSize,
    debounceTimeMs,
    onBatch: async (paths: string[]) => {
      const uniquePaths = [...new Set(paths)];
      await uploadBatch(uniquePaths, options, baseOptions);
    },
  });

  const watcher = chokidar.watch(paths, {
    ignoreInitial: true,
    ignored: (path: string) => !matcher(path),
  });

  watcher.on('add', (path) => batcher.add(path));
  watcher.on('change', (path) => batcher.add(path));

  return () => watcher.close();
};

// Cache for processed album names to avoid duplicate messages
const processedAlbumNames = new Set<string>();

export const upload = async (paths: string[], baseOptions: BaseOptions, options: UploadOptionsDto) => {
  // Clear the album names cache at the start of each upload command
  processedAlbumNames.clear();

  await authenticate(baseOptions);

  const scanFiles = await scan(paths, options);

  if (scanFiles.length === 0) {
    if (options.watch) {
      console.log('No files found initially.');
    } else {
      console.log('No files found, exiting');
      return;
    }
  }

  if (options.watch) {
    console.log('Watching for changes...');
    await startWatch(paths, options, baseOptions, {});
    // watcher does not handle the initial scan
    // as the scan() is a more efficient quick start with batched results
  }

  await uploadBatch(scanFiles, options, baseOptions);
};

const scan = async (pathsToCrawl: string[], options: UploadOptionsDto) => {
  const { image, video } = await getSupportedMediaTypes();

  console.log('Crawling for assets...');
  const files = await crawl({
    pathsToCrawl,
    recursive: options.recursive,
    exclusionPattern: options.ignore,
    includeHidden: options.includeHidden,
    extensions: [...image, ...video],
  });

  // Calculate total size
  try {
    const results = await Promise.allSettled(
      files.map((file) =>
        stat(file).then(
          (stats) => stats.size,
          () => 0,
        ),
      ),
    );

    const totalSize = results.reduce((sum, result) => (result.status === 'fulfilled' ? sum + result.value : sum), 0);
  } catch (error) {
    console.warn('Failed to calculate total size', error);
  }

  return files;
};

export const checkForDuplicates = async (
  files: string[],
  { concurrency, skipHash, progress }: UploadOptionsDto,
  { configDirectory }: BaseOptions,
) => {
  if (skipHash) {
    console.log('Skipping hash check, assuming all files are new');
    return { newFiles: files, duplicates: [] };
  }

  let multiBar: MultiBar | undefined;
  let totalSize = 0;
  const statsMap = new Map<string, Stats>();

  // Calculate total size first
  for (const filepath of files) {
    const stats = await stat(filepath);
    statsMap.set(filepath, stats);
    totalSize += stats.size;
  }

  let processedBytes = 0;
  let checkedBytes = 0;

  if (progress) {
    multiBar = new MultiBar(
      {
        format: '{message} | {bar} | {percentage}% | ETA: {eta_formatted} | {value}/{total}',
        formatValue: (v: number, options, type) => {
          // Don't format percentage
          if (type === 'percentage') {
            return v.toString();
          }
          return byteSize(v).toString();
        },
        etaBuffer: 100, // Increase samples for ETA calculation
      },
      Presets.shades_classic,
    );

    // Ensure we restore cursor on interrupt
    process.on('SIGINT', () => {
      if (multiBar) {
        multiBar.stop();
      }
      process.exit(0);
    });
  } else {
    console.log(`Received ${files.length} files (${byteSize(totalSize)}), hashing...`);
  }

  const hashProgressBar = multiBar?.create(totalSize, 0, {
    message: 'Hashing files          ',
  });
  const checkProgressBar = multiBar?.create(totalSize, 0, {
    message: 'Checking for duplicates',
  });

  const newFiles: string[] = [];
  const duplicates: Asset[] = [];

  const checkBulkUploadQueue = new Queue<AssetBulkUploadCheckItem[], void>(
    async (assets: AssetBulkUploadCheckItem[]) => {
      const response = await checkBulkUpload({ assetBulkUploadCheckDto: { assets } });

      const results = response.results as AssetBulkUploadCheckResults;

      for (const { id: filepath, assetId, action } of results) {
        if (action === Action.Accept) {
          newFiles.push(filepath);
        } else {
          // rejects are always duplicates
          duplicates.push({ id: assetId as string, filepath });
        }
      }

      // Update progress based on total size of processed files
      let processedSize = 0;
      for (const asset of assets) {
        const stats = statsMap.get(asset.id);
        processedSize += stats?.size || 0;
      }
      processedBytes += processedSize;
      // hashProgressBar?.increment(processedSize);
      checkedBytes += processedSize;
      checkProgressBar?.increment(processedSize);
    },
    { concurrency, retry: 3 },
  );

  const results: { id: string; checksum: string }[] = [];
  let checkBulkUploadRequests: AssetBulkUploadCheckItem[] = [];
  const hashCache = new FileHashCache(configDirectory);

  try {
    const queue = new Queue<string, AssetBulkUploadCheckItem[]>(
      async (filepath: string): Promise<AssetBulkUploadCheckItem[]> => {
        const stats = statsMap.get(filepath);
        if (!stats) {
          throw new Error(`Stats not found for ${filepath}`);
        }

        const mtimeMs = stats.mtime.getTime();
        const cachedChecksum = hashCache.get(filepath, mtimeMs, stats.size);
        const checksum = cachedChecksum ? cachedChecksum : await hashCache.compute(filepath, mtimeMs, stats.size);
        const dto = { id: filepath, checksum };

        results.push(dto);
        checkBulkUploadRequests.push(dto);
        if (checkBulkUploadRequests.length === 5000) {
          const batch = checkBulkUploadRequests;
          checkBulkUploadRequests = [];
          void checkBulkUploadQueue.push(batch);
        }

        hashProgressBar?.increment(stats.size);
        return results;
      },
      { concurrency, retry: 3 },
    );

    for (const item of files) {
      void queue.push(item);
    }

    await queue.drained();

    if (checkBulkUploadRequests.length > 0) {
      void checkBulkUploadQueue.push(checkBulkUploadRequests);
    }

    await checkBulkUploadQueue.drained();

    // Report failures
    const failedTasks = queue.tasks.filter((task) => task.status === 'failed');
    if (failedTasks.length > 0) {
      console.log(`Failed to verify ${failedTasks.length} file${s(failedTasks.length)}:`);
      for (const task of failedTasks) {
        console.log(`- ${task.data} - ${task.error}`);
      }
    }
  } finally {
    hashCache.close();
    multiBar?.stop();
  }

  console.log(`Found ${newFiles.length} new files and ${duplicates.length} duplicate${s(duplicates.length)}`);

  return { newFiles, duplicates };
};

export const uploadFiles = async (
  files: string[],
  { dryRun, concurrency, progress }: UploadOptionsDto,
): Promise<Asset[]> => {
  if (files.length === 0) {
    console.log('All assets were already uploaded, nothing to do.');
    return [];
  }

  // Compute total size first
  let totalSize = 0;
  const statsMap = new Map<string, Stats>();
  for (const filepath of files) {
    const stats = await stat(filepath);
    statsMap.set(filepath, stats);
    totalSize += stats.size;
  }

  if (dryRun) {
    console.log(`Would have uploaded ${files.length} asset${s(files.length)} (${byteSize(totalSize)})`);
    return files.map((filepath) => ({ id: '', filepath }));
  }

  let uploadProgress: SingleBar | undefined;

  if (progress) {
    uploadProgress = new SingleBar(
      {
        format: 'Uploading assets | {bar} | {percentage}% | ETA: {eta_formatted} | {value_formatted}/{total_formatted}',
      },
      Presets.shades_classic,
    );
  } else {
    console.log(`Uploading ${files.length} asset${s(files.length)} (${byteSize(totalSize)})`);
  }
  uploadProgress?.start(totalSize, 0);
  uploadProgress?.update({ value_formatted: 0, total_formatted: byteSize(totalSize) });

  let duplicateCount = 0;
  let duplicateSize = 0;
  let successCount = 0;
  let successSize = 0;

  const newAssets: Asset[] = [];

  const queue = new Queue<string, AssetMediaResponseDto>(
    async (filepath: string) => {
      const stats = statsMap.get(filepath);
      if (!stats) {
        throw new Error(`Stats not found for ${filepath}`);
      }

      const response = await uploadFile(filepath, stats);
      newAssets.push({ id: response.id, filepath });
      if (response.status === AssetMediaStatus.Duplicate) {
        duplicateCount++;
        duplicateSize += stats.size ?? 0;
      } else {
        successCount++;
        successSize += stats.size ?? 0;
      }

      uploadProgress?.update(successSize, { value_formatted: byteSize(successSize + duplicateSize) });

      return response;
    },
    { concurrency, retry: 3 },
  );

  for (const item of files) {
    void queue.push(item);
  }

  await queue.drained();

  uploadProgress?.stop();

  console.log(`Successfully uploaded ${successCount} new asset${s(successCount)} (${byteSize(successSize)})`);
  if (duplicateCount > 0) {
    console.log(`Skipped ${duplicateCount} duplicate asset${s(duplicateCount)} (${byteSize(duplicateSize)})`);
  }

  // Report failures
  const failedTasks = queue.tasks.filter((task) => task.status === 'failed');
  if (failedTasks.length > 0) {
    console.log(`Failed to upload ${failedTasks.length} asset${s(failedTasks.length)}:`);
    for (const task of failedTasks) {
      console.log(`- ${task.data} - ${task.error}`);
    }
  }

  return newAssets;
};

const uploadFile = async (input: string, stats: Stats): Promise<AssetMediaResponseDto> => {
  const { baseUrl, headers } = defaults;

  const assetPath = path.parse(input);
  const noExtension = path.join(assetPath.dir, assetPath.name);

  const sidecarsFiles = await Promise.all(
    // XMP sidecars can come in two filename formats. For a photo named photo.ext, the filenames are photo.ext.xmp and photo.xmp
    [`${noExtension}.xmp`, `${input}.xmp`].map(async (sidecarPath) => {
      try {
        const stats = await stat(sidecarPath);
        return new UploadFile(sidecarPath, stats.size);
      } catch {
        return false;
      }
    }),
  );

  const sidecarData = sidecarsFiles.find((file): file is UploadFile => file !== false);

  const formData = new FormData();
  formData.append('deviceAssetId', `${basename(input)}-${stats.size}`.replaceAll(/\s+/g, ''));
  formData.append('deviceId', 'CLI');
  formData.append('fileCreatedAt', stats.mtime.toISOString());
  formData.append('fileModifiedAt', stats.mtime.toISOString());
  formData.append('fileSize', String(stats.size));
  formData.append('isFavorite', 'false');
  formData.append('assetData', new UploadFile(input, stats.size));

  if (sidecarData) {
    formData.append('sidecarData', sidecarData);
  }

  const response = await fetch(`${baseUrl}/assets`, {
    method: 'post',
    redirect: 'error',
    headers: headers as Record<string, string>,
    body: formData,
  });
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(await response.text());
  }

  return response.json();
};

const deleteFiles = async (files: string[], options: UploadOptionsDto): Promise<void> => {
  if (!options.delete) {
    return;
  }

  if (options.dryRun) {
    console.log(`Would have deleted ${files.length} local asset${s(files.length)}`);
    return;
  }

  console.log('Deleting assets that have been uploaded...');

  const deletionProgress = new SingleBar(
    { format: 'Deleting local assets | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} assets' },
    Presets.shades_classic,
  );
  deletionProgress.start(files.length, 0);

  try {
    for (const assetBatch of chunk(files, options.concurrency)) {
      await Promise.all(assetBatch.map((input: string) => unlink(input)));
      deletionProgress.update(assetBatch.length);
    }
  } finally {
    deletionProgress.stop();
  }
};

const resolveServerDuplicates = async (albumTuples: AlbumPathTuple[]): Promise<Map<string, string>> => {
  const dirToAlbumName = new Map<string, string>();
  const usedNames = new Set<string>();

  // Sort by path depth (deepest first) to handle nesting properly
  const sortedTuples = [...albumTuples].sort(([a], [b]) => b.split(path.sep).length - a.split(path.sep).length);

  for (const [dir, albumName] of sortedTuples) {
    const finalName = albumName;
    let uniqueName = finalName;
    let counter = 1;

    // Only check against already used names in this batch
    while (usedNames.has(uniqueName)) {
      uniqueName = `${finalName} ${counter++}`;
    }

    usedNames.add(uniqueName);
    dirToAlbumName.set(dir, uniqueName);
  }

  return dirToAlbumName;
};

const updateAlbums = async (assets: Asset[], options: UploadOptionsDto) => {
  if (!options.album && !options.albumName) {
    return;
  }

  const { dryRun = false } = options;
  const concurrency = options.concurrency ?? 5;

  // Get existing albums from server
  const albums = await getAllAlbums({});
  const existingAlbums = new Map(albums.map((album) => [album.albumName, album.id]));
  const newAlbums: Set<string> = new Set();

  // Generate album names for all directories
  const albumTuples = generateAlbumNames(assets.map((a) => a.filepath));

  // Resolve any duplicates within this batch
  const dirToAlbumName = await resolveServerDuplicates(albumTuples);

  // Create mapping from filepath to album name
  const uploadAlbumNames = new Map<string, string>(); // filepath -> albumName

  for (const { filepath } of assets) {
    const dir = path.dirname(filepath);
    const albumName = dirToAlbumName.get(dir);
    if (albumName) {
      uploadAlbumNames.set(filepath, albumName);
      if (!existingAlbums.has(albumName)) {
        newAlbums.add(albumName);
      }
    }
  }

  if (dryRun) {
    if (newAlbums.size > 0) {
      console.log(`Would have created ${newAlbums.size} new album${s(newAlbums.size)}:`);
      for (const albumName of newAlbums) {
        console.log(`- ${albumName}`);
      }
    }
    console.log(`Would have updated albums of ${assets.length} asset${s(assets.length)}`);
    return;
  }

  const progressBar = new SingleBar(
    { format: 'Creating albums | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} albums' },
    Presets.shades_classic,
  );
  progressBar.start(newAlbums.size, 0);

  try {
    for (const albumNames of chunk([...newAlbums], concurrency)) {
      const items = await Promise.all(
        albumNames.map((albumName: string) => createAlbum({ createAlbumDto: { albumName } })),
      );
      for (const { id, albumName } of items) {
        existingAlbums.set(albumName, id);
      }
      progressBar.increment(albumNames.length);
    }
  } finally {
    progressBar.stop();
  }

  if (newAlbums.size > 0) {
    console.log(`Created ${newAlbums.size} new album${s(newAlbums.size)}`);
  }
  console.log(`Successfully updated ${assets.length} asset${s(assets.length)}`);

  const albumToAssets = new Map<string, string[]>();
  for (const asset of assets) {
    const albumName = uploadAlbumNames.get(asset.filepath);
    if (!albumName) {
      continue;
    }
    const albumId = existingAlbums.get(albumName);
    if (albumId) {
      if (!albumToAssets.has(albumId)) {
        albumToAssets.set(albumId, []);
      }
      albumToAssets.get(albumId)?.push(asset.id);
    }
  }

  const albumUpdateProgress = new SingleBar(
    { format: 'Adding assets to albums | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} assets' },
    Presets.shades_classic,
  );
  albumUpdateProgress.start(assets.length, 0);

  try {
    for (const [albumId, assets] of albumToAssets.entries()) {
      for (const assetBatch of chunk(assets, Math.min(1000 * concurrency, 65_000))) {
        await addAssetsToAlbum({ id: albumId, bulkIdsDto: { ids: assetBatch } });
        albumUpdateProgress.increment(assetBatch.length);
      }
    }
  } finally {
    albumUpdateProgress.stop();
  }
};

type AlbumPathTuple = [string, string]; // [directoryPath, albumName]

/**
 * Generate album names for all directories, resolving duplicates by adding parent directories
 */
const generateAlbumNames = (filepaths: string[]): AlbumPathTuple[] => {
  // First pass: collect all unique directories
  const directories = new Set<string>();
  for (const filepath of filepaths) {
    directories.add(path.dirname(filepath));
  }

  // Second pass: for each directory, collect all possible album name candidates
  // with increasing levels of context
  const dirCandidates = new Map<string, string[]>();

  for (const dir of directories) {
    const parts = dir.split(path.sep).filter(Boolean);
    const candidates: string[] = [];

    // Generate candidates with increasing context
    for (let i = 1; i <= parts.length; i++) {
      candidates.push(parts.slice(-i).join(' '));
    }

    dirCandidates.set(dir, candidates);
  }

  // Third pass: find the minimal unique name for each directory
  const result: AlbumPathTuple[] = [];
  const usedNames = new Set<string>();

  // Sort directories by depth (deepest first) to handle nesting properly
  const sortedDirs = [...directories].sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

  for (const dir of sortedDirs) {
    const candidates = dirCandidates.get(dir) || [];
    let selectedName = candidates[0] || '';

    // Find the shortest unique name
    for (const candidate of candidates) {
      selectedName = candidate;

      // Check if this name is already used
      let isUnique = true;
      for (const [otherDir, otherCandidates] of dirCandidates) {
        if (otherDir === dir) {
          continue;
        }

        if (otherCandidates.includes(candidate)) {
          isUnique = false;
          break;
        }
      }

      if (isUnique) {
        break;
      }
    }

    // Add to used names and result
    if (selectedName) {
      usedNames.add(selectedName);
      result.push([dir, selectedName]);
    }
  }

  return result;
};

// `filepath` valid format:
// - Windows: `D:\\test\\Filename.txt` or `D:/test/Filename.txt`
// - Unix: `/test/Filename.txt`
export const getAlbumName = (filepath: string, options: UploadOptionsDto) => {
  return options.albumName ?? path.basename(path.dirname(filepath));
};
