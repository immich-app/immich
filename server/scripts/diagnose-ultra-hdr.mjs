#!/usr/bin/env node
/**
 * Ultra HDR Diagnostic Script
 * 
 * This script analyzes images to detect Ultra HDR metadata and gainmap information.
 * Run with: node scripts/diagnose-ultra-hdr.mjs <image-path>
 * 
 * Or scan a directory: node scripts/diagnose-ultra-hdr.mjs /path/to/images
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ultra HDR related XMP tags to check
const ULTRA_HDR_TAGS = [
  'HdrImageType',
  'Gainmap',
  'GainmapImage',
  'GainmapSettings',
  'ImagePixelDepth',
  'SceneType',
  'ColorTonality',
  'RelativeLuminanceMin',
  'RelativeLuminanceMax',
  'HDRGainmapOrientation',
  'HDRGainmapVersion',
];

// JPEG/HDR related Exif tags
const HDR_EXIF_TAGS = [
  'ImageDescription',
  'XPAuthor',
  'XPComment',
  'UserComment',
  'ImageUniqueID',
  'CameraOwnerName',
  'BodySerialNumber',
  'LensSpecification',
  'LensModel',
  'LensSerialNumber',
  'ColorSpace',
  'BitsPerSample',
  'PixelFormat',
  'PhotometricInterpretation',
  'SamplesPerPixel',
];

async function analyzeImage(filePath) {
  const results = {
    path: filePath,
    exists: false,
    size: 0,
    extension: '',
    isHeic: false,
    isAvif: false,
    isJpeg: false,
    ultraHdrTags: {},
    hdrExifTags: {},
    gainmapDetected: false,
    hasAuxiliaryImage: false,
    diagnosis: '',
    recommendations: []
  };

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      results.diagnosis = 'FILE_NOT_FOUND';
      return results;
    }

    results.exists = true;
    const stats = fs.statSync(filePath);
    results.size = stats.size;
    
    // Get extension
    results.extension = path.extname(filePath).toLowerCase();
    results.isHeic = ['.heic', '.heif'].includes(results.extension);
    results.isAvif = ['.avif'].includes(results.extension);
    results.isJpeg = ['.jpg', '.jpeg'].includes(results.extension);

    // Try to read file and check for Ultra HDR markers
    const buffer = fs.readFileSync(filePath);
    
    // Check for HEIF brand markers
    if (results.isHeic || results.isAvif) {
      const brand = buffer.slice(4, 8).toString('ascii');
      results.heifBrand = brand;
      
      // Check for 'hvc1' brand (HEVC encoded)
      if (brand.startsWith('hvc1') || brand.startsWith('avif')) {
        results.hasHevcCodec = true;
      }
    }

    // Search for XMP packets with Ultra HDR markers
    const xmpPattern = /<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi;
    const xmpMatches = buffer.toString('latin1').match(xmpPattern);
    
    if (xmpMatches) {
      for (const xmp of xmpMatches) {
        // Check for Ultra HDR namespace
        if (xmp.includes('urn:hdr:ultra')) {
          results.hasUltraHdrXmp = true;
        }
        
        // Check for HDRGainmap namespace
        if (xmp.includes('HDRGainmap') || xmp.includes('hdr:ultra')) {
          results.gainmapDetected = true;
        }
        
        // Extract HDR-related XMP tags
        for (const tag of ULTRA_HDR_TAGS) {
          const regex = new RegExp(`${tag}[^>]*>([^<]*)</${tag}>`, 'i');
          const match = xmp.match(regex);
          if (match) {
            results.ultraHdrTags[tag] = match[1].trim();
          }
          
          // Also check for namespace-prefixed tags
          const nsRegex = new RegExp(`hdr:${tag}[^>]*>([^<]*)</hdr:${tag}>`, 'i');
          const nsMatch = xmp.match(nsRegex);
          if (nsMatch) {
            results.ultraHdrTags[`hdr:${tag}`] = nsMatch[1].trim();
          }
        }
      }
    }

    // Check for Auxiliary Image entry (gainmap storage)
    if (xmpMatches) {
      for (const xmp of xmpMatches) {
        if (xmp.includes('AuxiliaryImage')) {
          results.hasAuxiliaryImage = true;
          results.recommendations.push('Image contains Auxiliary Image (likely gainmap)');
        }
      }
    }

    // Generate diagnosis
    if (results.gainmapDetected) {
      results.diagnosis = 'ULTRA_HDR_DETECTED';
      results.recommendations.push('Image has Ultra HDR gainmap metadata');
      results.recommendations.push('Immich should extract and preserve gainmap');
    } else if (results.isHeic || results.isAvif) {
      results.diagnosis = 'HEIC/AVIF_BUT_NO_HDR';
      results.recommendations.push('File is HEIC/AVIF but no Ultra HDR metadata detected');
      results.recommendations.push('This may be a standard SDR image or HDR metadata was stripped');
    } else if (results.isJpeg) {
      results.diagnosis = 'JPEG_SDR';
      results.recommendations.push('File is standard JPEG (SDR)');
    }

  } catch (error) {
    results.error = error.message;
    results.diagnosis = 'ERROR';
  }

  return results;
}

async function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subResults = await scanDirectory(fullPath);
        results.push(...subResults);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.heic', '.heif', '.avif', '.jpg', '.jpeg'].includes(ext)) {
          const result = await analyzeImage(fullPath);
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory: ${error.message}`);
  }
  
  return results;
}

function printResults(results) {
  console.log('\n' + '='.repeat(80));
  console.log('ULTRA HDR DIAGNOSTIC REPORT');
  console.log('='.repeat(80));

  if (!results.exists) {
    console.log(`\n❌ FILE NOT FOUND: ${results.path}`);
    return;
  }

  console.log(`\n📁 File: ${results.path}`);
  console.log(`📊 Size: ${(results.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🏷️  Format: ${results.extension.toUpperCase()}`);
  
  if (results.isHeic || results.isAvif) {
    console.log(`🎬 Codec: ${results.heifBrand || 'Unknown'}`);
  }

  console.log('\n--- HDR Detection ---');
  
  if (results.gainmapDetected) {
    console.log('✅ ULTRA HDR GAINMAP DETECTED');
  } else {
    console.log('❌ No Ultra HDR gainmap detected');
  }

  if (results.hasAuxiliaryImage) {
    console.log('✅ Auxiliary Image (gainmap storage) detected');
  }

  if (Object.keys(results.ultraHdrTags).length > 0) {
    console.log('\n📋 Ultra HDR XMP Tags:');
    for (const [tag, value] of Object.entries(results.ultraHdrTags)) {
      console.log(`   ${tag}: ${value}`);
    }
  }

  console.log('\n--- Diagnosis ---');
  console.log(`🎯 Result: ${results.diagnosis}`);

  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    for (const rec of results.recommendations) {
      console.log(`   • ${rec}`);
    }
  }

  if (results.error) {
    console.log(`\n⚠️  Error: ${results.error}`);
  }

  console.log('='.repeat(80));
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Ultra HDR Diagnostic Tool
==========================

Usage:
  node diagnose-ultra-hdr.mjs <image-path>     Analyze single image
  node diagnose-ultra-hdr.mjs <directory-path>  Scan directory for HDR images

Purpose:
  Detects Ultra HDR metadata, gainmap information, and auxiliary images
  in HEIC/AVIF/JPEG files. Helps diagnose why HDR photos appear "blash" 
  in Immich.
`);
    process.exit(0);
  }

  const target = args[0];
  let results;

  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    console.log(`\n🔍 Scanning directory: ${target}`);
    results = await scanDirectory(target);
    
    console.log(`\n📊 Found ${results.length} image files`);
    
    const hdrCount = results.filter(r => r.diagnosis === 'ULTRA_HDR_DETECTED').length;
    const heicNoHdr = results.filter(r => r.diagnosis === 'HEIC/AVIF_BUT_NO_HDR').length;
    
    console.log(`   Ultra HDR: ${hdrCount}`);
    console.log(`   HEIC/AVIF without HDR: ${heicNoHdr}`);
    console.log('');
    
    // Print each result
    for (const result of results) {
      printResults(result);
      console.log('');
    }
  } else {
    results = await analyzeImage(target);
    printResults(results);
  }

  // Summary
  console.log('\n📝 SUMMARY FOR DEBUGGING:');
  console.log('------------------------');
  console.log('If you see ULTRA_HDR_DETECTED but Immich shows bland images:');
  console.log('1. Immich is not extracting the gainmap');
  console.log('2. Thumbnails are generated without HDR metadata');
  console.log('3. Mobile app does not render HDR gainmaps');
  console.log('\nRequired fixes:');
  console.log('1. Extract Ultra HDR XMP tags during metadata extraction');
  console.log('2. Preserve gainmap for thumbnail generation');
  console.log('3. Add HDR rendering support to mobile app');
}

main().catch(console.error);
