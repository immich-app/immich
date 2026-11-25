#!/usr/bin/env node
import { ContainerDirectoryItem, DefaultExifToolOptions, exiftoolPath } from 'exiftool-vendored';
import { ReadTask } from 'exiftool-vendored/dist/ReadTask.js';
import { chunk } from 'lodash-es';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { promisify } from 'node:util';
import { v5 } from 'uuid';
import { IMMICH_TAGS, exiftoolOptions } from 'src/repositories/metadata.repository.js';
import { EXIF_DATE_TAGS } from 'src/services/metadata.service.js';
import { mimeTypes } from 'src/utils/mime-types.js';

const IGNORED_TAGS = new Set([
  'Directory',
  'ExifToolVersion',
  'FileAccessDate',
  'FileInodeChangeDate',
  'FileModifyDate',
  'FileName',
  'FilePermissions',
]);

const COORDINATE_TAGS = new Set(['GPSLatitude', 'GPSLongitude', 'GPSPosition', 'GpsLatitude', 'GpsLongitude']);

const COORDINATE_DECIMALS = 2;

const SKIPPED_MIME_TYPES = new Set(['image/gif']);

const DATE_TAGS = new Set<string>([
  ...EXIF_DATE_TAGS,
  'GPSDateStamp',
  'GPSTimeStamp',
  'ModifyDate',
  'OffsetTime',
  'OffsetTimeDigitized',
  'OffsetTimeOriginal',
  'SubSecTimeOriginal',
  'TimeZone',
  'TimeZoneOffset',
]);

const OFFSET_TAGS = new Set(['OffsetTime', 'OffsetTimeOriginal', 'TimeZone']);

const VALUE_TAGS = new Set([
  ...OFFSET_TAGS,
  'AndroidMake',
  'BitsPerSample',
  'ColorSpace',
  'DeviceManufacturer',
  'EmbeddedVideoType',
  'Make',
  'MicroVideo',
  'MotionPhoto',
  'Orientation',
  'ProjectionType',
  'Rating',
  'Rotation',
]);

const PATTERN_TAGS = new Set(['LensID', 'LensModel', 'LensSpec', 'LensType']);

const BATCH_SIZE = 200;

type DatasetImage = {
  id: string;
  path: string;
  fixturePath: string;
  captureType?: string;
};

type RawTags = Record<string, unknown>;

const main = async () => {
  const [datasetDir, outputPath] = process.argv.slice(2);
  if (!datasetDir || !outputPath) {
    console.error('Usage: metadata-fixtures <dataset> <output>');
    process.exit(1);
  }

  const images = await getDatasetImages(datasetDir);
  const covered = new Set<string>();
  const lines: string[] = [];
  let read = 0;

  await mkdir(dirname(outputPath), { recursive: true });

  for (const batch of chunk(images, BATCH_SIZE)) {
    for (const { image, tags } of await readRawTags(batch, `${outputPath}.args`)) {
      const signatures = getSignatures(image, tags);
      if (signatures.every((signature) => covered.has(signature))) {
        continue;
      }

      for (const signature of signatures) {
        covered.add(signature);
      }

      lines.push(JSON.stringify(tags));
    }

    read += batch.length;
    console.log(`Read ${read}/${images.length}, kept ${lines.length}`);
  }

  await writeFile(outputPath, lines.map((line) => `${line}\n`).join(''));
};

const getDatasetImages = async (datasetDir: string) => {
  const entries = await readdir(datasetDir, { recursive: true });
  const images: DatasetImage[] = [];

  for (const entry of entries.toSorted()) {
    if (!isFixtureImage(entry)) {
      continue;
    }

    const id = v5(entry, v5.URL);
    images.push({
      id,
      path: join(datasetDir, entry),
      fixturePath: `/fixtures/${id}${extname(entry).toLowerCase()}`,
      captureType: await getCaptureType(join(datasetDir, getInfoPath(entry))),
    });
  }

  return images;
};

const isFixtureImage = (path: string) => mimeTypes.isImage(path) && !SKIPPED_MIME_TYPES.has(mimeTypes.lookup(path));

const getInfoPath = (imagePath: string) => imagePath.replace(/-image\.[^.]+$/, '-info.json');

const getCaptureType = async (infoPath: string) => {
  const info = await readFile(infoPath, 'utf8').catch(() => null);
  return info ? (JSON.parse(info).captureType as string) : undefined;
};

const readRawTags = async (images: DatasetImage[], argsFile: string) => {
  const readArgs = ReadTask.for(images[0].path, { ...DefaultExifToolOptions, ...exiftoolOptions }).args.slice(0, -1);
  await writeFile(argsFile, [...readArgs, ...images.map(({ path }) => path)].join('\n'));

  const { stdout } = await promisify(execFile)(await exiftoolPath(), ['-@', argsFile], { maxBuffer: 1 << 30 });
  await rm(argsFile);

  const imagesByPath = new Map(images.map((image) => [image.path, image]));
  return (JSON.parse(stdout) as RawTags[]).map((tags) => {
    const image = imagesByPath.get(String(tags.SourceFile))!;
    return { image, tags: toFixtureTags(image, tags) };
  });
};

const toFixtureTags = (image: DatasetImage, tags: RawTags) => {
  const fixtureTags = Object.fromEntries(
    Object.entries(tags)
      .filter(([key]) => !IGNORED_TAGS.has(key))
      .map(([key, value]) => [key, COORDINATE_TAGS.has(key) ? toCoarseCoordinates(value) : value]),
  );
  return { ...fixtureTags, SourceFile: image.fixturePath };
};

const toCoarseCoordinates = (value: unknown) => {
  if (typeof value === 'number') {
    return roundCoordinate(value);
  }

  if (typeof value === 'string') {
    return value.replaceAll(/\d+\.\d+/g, (coordinate) => String(roundCoordinate(Number(coordinate))));
  }

  return value;
};

const roundCoordinate = (coordinate: number) => Number(coordinate.toFixed(COORDINATE_DECIMALS));

const getSignatures = (image: DatasetImage, tags: RawTags) => {
  const present = (keys: Iterable<string>) => [...keys].filter((key) => key in tags);
  const group = [tags.Make, tags.Model, image.captureType, mimeTypes.lookup(image.path)];
  const signatures = [
    `group:${group.map((value) => String(value).trim().toLowerCase())}`,
    `dates:${extname(image.path)}:${present(DATE_TAGS).map((key) => `${key}=${toPattern(tags[key])}`)}`,
    `tags:${extname(image.path)}:${tags.Orientation}:${present(DATE_TAGS.union(new Set(IMMICH_TAGS)))}`,
    ...present(VALUE_TAGS).map((key) => `value:${key}=${JSON.stringify(tags[key])}`),
    ...present(PATTERN_TAGS).map((key) => `pattern:${key}=${toPattern(tags[key])}`),
  ];

  if (typeof tags.GPSLatitude === 'number' && typeof tags.GPSLongitude === 'number') {
    const hasOffset = present(OFFSET_TAGS).length > 0;
    signatures.push(`timezone:${hasOffset}:${exiftoolOptions.geoTz!(tags.GPSLatitude, tags.GPSLongitude)}`);
  }

  if (Array.isArray(tags.ContainerDirectory)) {
    const items = tags.ContainerDirectory as ContainerDirectoryItem[];
    signatures.push(`container:${items.map((entry) => entry?.Item?.Semantic)}`);
  }

  return signatures;
};

const toPattern = (value: unknown) =>
  String(value)
    .replaceAll(/[A-Za-z]+/g, 'a')
    .replaceAll(/\d/g, '9');

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
