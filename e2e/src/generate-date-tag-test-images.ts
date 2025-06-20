#!/usr/bin/env node

/**
 * Script to generate test images with additional EXIF date tags
 * This creates actual JPEG images with embedded metadata for testing
 * Images are generated into e2e/test-assets/metadata/dates/
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

interface TestImage {
  filename: string;
  description: string;
  exifTags: Record<string, string>;
}

const testImages: TestImage[] = [
  {
    filename: 'time-created.jpg',
    description: 'Image with TimeCreated tag',
    exifTags: {
      'TimeCreated': '2023:11:15 14:30:00',
      'Make': 'Canon',
      'Model': 'EOS R5',
    }
  },
  {
    filename: 'gps-datetime.jpg', 
    description: 'Image with GPSDateTime and coordinates',
    exifTags: {
      'GPSDateTime': '2023:11:15 12:30:00Z',
      'GPSLatitude': '37.7749',
      'GPSLongitude': '-122.4194',
      'GPSLatitudeRef': 'N',
      'GPSLongitudeRef': 'W',
    }
  },
  {
    filename: 'datetime-utc.jpg',
    description: 'Image with DateTimeUTC tag',
    exifTags: {
      'DateTimeUTC': '2023:11:15 10:30:00',
      'Make': 'Nikon',
      'Model': 'D850',
    }
  },
  {
    filename: 'gps-datestamp.jpg',
    description: 'Image with GPSDateStamp and GPSTimeStamp',
    exifTags: {
      'GPSDateStamp': '2023:11:15',
      'GPSTimeStamp': '08:30:00',
      'GPSLatitude': '51.5074',
      'GPSLongitude': '-0.1278',
      'GPSLatitudeRef': 'N',
      'GPSLongitudeRef': 'W',
    }
  },
  {
    filename: 'sony-datetime2.jpg',
    description: 'Sony camera image with SonyDateTime2 tag',
    exifTags: {
      'SonyDateTime2': '2023:11:15 06:30:00',
      'Make': 'SONY',
      'Model': 'ILCE-7RM5',
    }
  },
  {
    filename: 'date-priority-test.jpg',
    description: 'Image with multiple date tags to test priority',
    exifTags: {
      'SubSecDateTimeOriginal': '2023:01:01 01:00:00',
      'DateTimeOriginal': '2023:02:02 02:00:00',
      'SubSecCreateDate': '2023:03:03 03:00:00',
      'CreateDate': '2023:04:04 04:00:00',
      'CreationDate': '2023:05:05 05:00:00',
      'DateTimeCreated': '2023:06:06 06:00:00',
      'TimeCreated': '2023:07:07 07:00:00',
      'GPSDateTime': '2023:08:08 08:00:00',
      'DateTimeUTC': '2023:09:09 09:00:00',
      'GPSDateStamp': '2023:10:10',
      'SonyDateTime2': '2023:11:11 11:00:00',
    }
  },
  {
    filename: 'new-tags-only.jpg',
    description: 'Image with only additional date tags (no standard tags)',
    exifTags: {
      'TimeCreated': '2023:12:01 15:45:30',
      'GPSDateTime': '2023:12:01 13:45:30Z',
      'DateTimeUTC': '2023:12:01 13:45:30',
      'GPSDateStamp': '2023:12:01',
      'SonyDateTime2': '2023:12:01 08:45:30',
      'GPSLatitude': '40.7128',
      'GPSLongitude': '-74.0060',
      'GPSLatitudeRef': 'N',
      'GPSLongitudeRef': 'W',
    }
  },
];

const generateTestImages = async (): Promise<void> => {
  // Target directory: e2e/test-assets/metadata/dates/
  // Current file is in: e2e/src/
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const targetDir = join(__dirname, '..', 'test-assets', 'metadata', 'dates');

  console.log('Generating test images with additional EXIF date tags...');
  console.log(`Target directory: ${targetDir}`);

  for (const image of testImages) {
    try {
      const imagePath = join(targetDir, image.filename);
      
      // Create unique JPEG file using Sharp
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      
      const jpegData = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r, g, b }
        }
      })
      .jpeg({ quality: 90 })
      .toBuffer();
      
      writeFileSync(imagePath, jpegData);
      
      // Build exiftool command to add EXIF data
      const exifArgs = Object.entries(image.exifTags)
        .map(([tag, value]) => `-${tag}="${value}"`)
        .join(' ');
      
      const command = `exiftool ${exifArgs} -overwrite_original "${imagePath}"`;
      
      console.log(`Creating ${image.filename}: ${image.description}`);
      execSync(command, { stdio: 'pipe' });
      
      // Verify the tags were written
      const verifyCommand = `exiftool -json "${imagePath}"`;
      const result = execSync(verifyCommand, { encoding: 'utf8' });
      const metadata = JSON.parse(result)[0];
      
      console.log(`  ✓ Created with ${Object.keys(image.exifTags).length} EXIF tags`);
      
      // Log first date tag found for verification
      const firstDateTag = Object.keys(image.exifTags).find(tag => 
        tag.includes('Date') || tag.includes('Time') || tag.includes('Created')
      );
      if (firstDateTag && metadata[firstDateTag]) {
        console.log(`  ✓ Verified ${firstDateTag}: ${metadata[firstDateTag]}`);
      }
      
    } catch (error) {
      console.error(`Failed to create ${image.filename}:`, (error as Error).message);
    }
  }

  console.log('\nTest image generation complete!');
  console.log('Files created in:', targetDir);
  console.log('\nTo test these images:');
  console.log(`cd ${targetDir} && exiftool -time:all -gps:all *.jpg`);
};

export { generateTestImages };

// Run the generator if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestImages().catch(console.error);
}