#!/usr/bin/env npx ts-node
/**
 * Test script for Google Photos Takeout parsing
 *
 * Usage:
 *   cd cli
 *   npx ts-node src/google-takeout/test-parser.ts /path/to/extracted/Takeout
 */

import { parseTakeout, getStats, convertToXmp, hasUsefulMetadata } from './index.js';
import type { TakeoutAsset } from './types.js';

async function main() {
  const paths = process.argv.slice(2);

  if (paths.length === 0) {
    console.log('Usage: npx ts-node src/google-takeout/test-parser.ts /path/to/Takeout');
    console.log('\nExtract your Google Takeout ZIP first, then point to the extracted folder.');
    process.exit(1);
  }

  console.log('Parsing Google Takeout from:', paths.join(', '));
  console.log('---');

  const assets: TakeoutAsset[] = [];
  const albumCounts = new Map<string, number>();

  for await (const asset of parseTakeout({ paths })) {
    assets.push(asset);

    // Track albums
    if (asset.albumName) {
      albumCounts.set(asset.albumName, (albumCounts.get(asset.albumName) || 0) + 1);
    }

    // Show first 10 assets as examples
    if (assets.length <= 10) {
      console.log(`\n[${assets.length}] ${asset.mediaPath}`);
      console.log(`    JSON: ${asset.jsonPath || '(not found)'}`);
      console.log(`    Album: ${asset.albumName || '(none)'}`);

      if (asset.metadata) {
        console.log(`    Title: ${asset.metadata.title}`);
        console.log(`    Date: ${asset.metadata.photoTakenTime?.formatted || '(none)'}`);
        console.log(`    GPS: ${asset.metadata.geoData?.latitude}, ${asset.metadata.geoData?.longitude}`);
        console.log(`    Favorited: ${asset.metadata.favorited}`);
        console.log(`    People: ${asset.metadata.people?.map(p => p.name).join(', ') || '(none)'}`);

        if (hasUsefulMetadata(asset.metadata)) {
          console.log(`    XMP Preview (first 500 chars):`);
          const xmp = convertToXmp(asset.metadata);
          console.log(`    ${xmp.slice(0, 500).replace(/\n/g, '\n    ')}...`);
        }
      }

      if (asset.isLivePhoto) {
        console.log(`    Live Photo video: ${asset.livePhotoVideoPath}`);
      }
    }
  }

  // Summary
  const stats = getStats(assets);

  console.log('\n---');
  console.log('SUMMARY');
  console.log('---');
  console.log(`Total media files: ${stats.totalMediaFiles}`);
  console.log(`Matched with JSON: ${stats.matchedWithJson} (${((stats.matchedWithJson / stats.totalMediaFiles) * 100).toFixed(1)}%)`);
  console.log(`Missing JSON: ${stats.missingJson}`);
  console.log(`Live Photos: ${stats.livePhotos}`);
  console.log(`Albums found: ${stats.albums}`);

  if (albumCounts.size > 0) {
    console.log('\nAlbums:');
    const sortedAlbums = [...albumCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [album, count] of sortedAlbums.slice(0, 20)) {
      console.log(`  - ${album}: ${count} assets`);
    }
    if (sortedAlbums.length > 20) {
      console.log(`  ... and ${sortedAlbums.length - 20} more albums`);
    }
  }

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of stats.errors) {
      console.log(`  - ${error}`);
    }
  }
}

main().catch(console.error);
