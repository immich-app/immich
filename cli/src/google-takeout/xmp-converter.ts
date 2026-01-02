/**
 * XMP Sidecar Converter for Google Photos Metadata
 *
 * Converts Google Photos JSON metadata to XMP format that Immich can read.
 * This allows the existing metadata extraction pipeline to process the data.
 */

import type { GooglePhotosMetadata } from './types.js';

/**
 * Convert Google Photos metadata to XMP sidecar content
 *
 * @param metadata - Parsed Google Photos JSON metadata
 * @returns XMP XML string ready to be written as a .xmp file
 */
export function convertToXmp(metadata: GooglePhotosMetadata): string {
  const dateTime = formatExifDateTime(metadata.photoTakenTime?.timestamp);
  const createDate = formatExifDateTime(metadata.creationTime?.timestamp);

  const hasGps = metadata.geoData && (metadata.geoData.latitude !== 0 || metadata.geoData.longitude !== 0);

  // Build XMP document
  const xmpParts: string[] = [
    `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>`,
    `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Google Photos Takeout Converter">`,
    `  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`,
    `    <rdf:Description rdf:about=""`,
    `      xmlns:dc="http://purl.org/dc/elements/1.1/"`,
    `      xmlns:xmp="http://ns.adobe.com/xap/1.0/"`,
    `      xmlns:exif="http://ns.adobe.com/exif/1.0/"`,
    `      xmlns:tiff="http://ns.adobe.com/tiff/1.0/"`,
    `      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"`,
    hasGps ? `      xmlns:exifEX="http://cipa.jp/exif/1.0/"` : '',
    `      xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"`,
    `      xmlns:mwg-rs="http://www.metadataworkinggroup.com/schemas/regions/"`,
    `      xmlns:stArea="http://ns.adobe.com/xmp/sType/Area#">`,
  ];

  // Title
  if (metadata.title) {
    xmpParts.push(`      <dc:title>`);
    xmpParts.push(`        <rdf:Alt>`);
    xmpParts.push(`          <rdf:li xml:lang="x-default">${escapeXml(metadata.title)}</rdf:li>`);
    xmpParts.push(`        </rdf:Alt>`);
    xmpParts.push(`      </dc:title>`);
  }

  // Description
  if (metadata.description) {
    xmpParts.push(`      <dc:description>`);
    xmpParts.push(`        <rdf:Alt>`);
    xmpParts.push(`          <rdf:li xml:lang="x-default">${escapeXml(metadata.description)}</rdf:li>`);
    xmpParts.push(`        </rdf:Alt>`);
    xmpParts.push(`      </dc:description>`);
  }

  // Dates
  if (dateTime) {
    xmpParts.push(`      <exif:DateTimeOriginal>${dateTime}</exif:DateTimeOriginal>`);
    xmpParts.push(`      <xmp:CreateDate>${dateTime}</xmp:CreateDate>`);
    xmpParts.push(`      <photoshop:DateCreated>${dateTime}</photoshop:DateCreated>`);
  } else if (createDate) {
    xmpParts.push(`      <xmp:CreateDate>${createDate}</xmp:CreateDate>`);
  }

  // GPS coordinates
  if (hasGps) {
    const { latitude, longitude, altitude } = metadata.geoData;

    xmpParts.push(`      <exif:GPSLatitude>${formatGpsCoordinate(latitude, 'lat')}</exif:GPSLatitude>`);
    xmpParts.push(`      <exif:GPSLongitude>${formatGpsCoordinate(longitude, 'lon')}</exif:GPSLongitude>`);

    if (altitude !== 0) {
      xmpParts.push(`      <exif:GPSAltitude>${Math.abs(altitude)}/1</exif:GPSAltitude>`);
      xmpParts.push(`      <exif:GPSAltitudeRef>${altitude >= 0 ? '0' : '1'}</exif:GPSAltitudeRef>`);
    }
  }

  // Rating (favorited = 5 stars)
  if (metadata.favorited) {
    xmpParts.push(`      <xmp:Rating>5</xmp:Rating>`);
  }

  // People/face regions (if available)
  if (metadata.people && metadata.people.length > 0) {
    xmpParts.push(`      <mwg-rs:Regions>`);
    xmpParts.push(`        <mwg-rs:RegionList>`);
    xmpParts.push(`          <rdf:Bag>`);
    for (const person of metadata.people) {
      xmpParts.push(`            <rdf:li>`);
      xmpParts.push(`              <rdf:Description>`);
      xmpParts.push(`                <mwg-rs:Name>${escapeXml(person.name)}</mwg-rs:Name>`);
      xmpParts.push(`                <mwg-rs:Type>Face</mwg-rs:Type>`);
      // Note: Google doesn't export face coordinates, only names
      xmpParts.push(`              </rdf:Description>`);
      xmpParts.push(`            </rdf:li>`);
    }
    xmpParts.push(`          </rdf:Bag>`);
    xmpParts.push(`        </mwg-rs:RegionList>`);
    xmpParts.push(`      </mwg-rs:Regions>`);
  }

  // Source information
  if (metadata.googlePhotosOrigin) {
    const origin = metadata.googlePhotosOrigin;
    let source = 'Google Photos';
    if (origin.mobileUpload?.deviceType) {
      source += ` (${origin.mobileUpload.deviceType})`;
    }
    if (origin.fromPartnerSharing) {
      source += ' (Partner Sharing)';
    }
    xmpParts.push(`      <xmp:CreatorTool>${escapeXml(source)}</xmp:CreatorTool>`);
  }

  // Close tags
  xmpParts.push(`    </rdf:Description>`);
  xmpParts.push(`  </rdf:RDF>`);
  xmpParts.push(`</x:xmpmeta>`);
  xmpParts.push(`<?xpacket end="w"?>`);

  return xmpParts.filter((line) => line.length > 0).join('\n');
}

/**
 * Format Unix timestamp to EXIF DateTime format
 *
 * @param timestamp - Unix timestamp in seconds (as string)
 * @returns EXIF DateTime format: "YYYY-MM-DDTHH:MM:SS"
 */
function formatExifDateTime(timestamp?: string): string | null {
  if (!timestamp || timestamp === '0') {
    return null;
  }

  try {
    const date = new Date(Number.parseInt(timestamp, 10) * 1000);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // Format as ISO 8601 without milliseconds
    return date.toISOString().slice(0, 19);
  } catch {
    return null;
  }
}

/**
 * Format GPS coordinate to EXIF format
 *
 * @param coordinate - Decimal degrees
 * @param type - 'lat' for latitude, 'lon' for longitude
 * @returns EXIF GPS format: "DD,MM.MMM[NSEW]"
 */
function formatGpsCoordinate(coordinate: number, type: 'lat' | 'lon'): string {
  const isNegative = coordinate < 0;
  const absCoord = Math.abs(coordinate);

  const degrees = Math.floor(absCoord);
  const minutes = (absCoord - degrees) * 60;

  let direction: string;
  if (type === 'lat') {
    direction = isNegative ? 'S' : 'N';
  } else {
    direction = isNegative ? 'W' : 'E';
  }

  return `${degrees},${minutes.toFixed(6)}${direction}`;
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate XMP sidecar filename for a media file
 *
 * @param mediaPath - Path to the media file
 * @returns Path for the XMP sidecar file
 */
export function getXmpSidecarPath(mediaPath: string): string {
  return `${mediaPath}.xmp`;
}

/**
 * Check if metadata has any meaningful data to convert
 */
export function hasUsefulMetadata(metadata: GooglePhotosMetadata): boolean {
  // Check if there's any data worth preserving
  if (metadata.description && metadata.description.trim().length > 0) {
    return true;
  }

  if (metadata.photoTakenTime?.timestamp && metadata.photoTakenTime.timestamp !== '0') {
    return true;
  }

  if (metadata.geoData && (metadata.geoData.latitude !== 0 || metadata.geoData.longitude !== 0)) {
    return true;
  }

  if (metadata.favorited) {
    return true;
  }

  if (metadata.people && metadata.people.length > 0) {
    return true;
  }

  return false;
}
