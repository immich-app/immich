# Google Photos Takeout Integration Path Analysis

## Executive Summary

This document explores integration paths for abstracting Google Photos migrations via Takeout directly into Immich. Currently, users must use the external [immich-go](https://github.com/simulot/immich-go) tool, which the Immich team recommends. This analysis evaluates potential native integration approaches.

## Current Migration Workflow

```
┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐     ┌──────────┐
│  Google Photos  │────▶│ Google Takeout │────▶│   immich-go     │────▶│  Immich  │
│  (source)       │     │ (export ZIPs)  │     │  (CLI tool)     │     │ (target) │
└─────────────────┘     └────────────────┘     └─────────────────┘     └──────────┘
```

## Google Photos Takeout Format Challenges

### 1. JSON Metadata Sidecars

Google exports metadata as JSON files with various naming conventions:

```
Takeout/
└── Google Photos/
    ├── Photos from 2024/
    │   ├── IMG_1234.jpg
    │   ├── IMG_1234.jpg.supplemental-metadata.json   # Primary format
    │   ├── IMG_5678.HEIC
    │   └── IMG_5678.HEIC.supplemental-metadata.json
    └── Album Name/
        ├── photo.jpg
        └── photo.jpg.supplemental-metadata.json
```

#### JSON Structure
```json
{
  "title": "IMG_1234.jpg",
  "description": "Optional user description",
  "imageViews": "42",
  "creationTime": {
    "timestamp": "1735660800",
    "formatted": "Jan 1, 2025, 12:00:00 AM UTC"
  },
  "photoTakenTime": {
    "timestamp": "1704067200",
    "formatted": "Jan 1, 2024, 12:00:00 AM UTC"
  },
  "geoData": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 10.0,
    "latitudeSpan": 0.0,
    "longitudeSpan": 0.0
  },
  "geoDataExif": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 10.0,
    "latitudeSpan": 0.0,
    "longitudeSpan": 0.0
  },
  "url": "https://photos.google.com/photo/...",
  "googlePhotosOrigin": {
    "mobileUpload": {
      "deviceType": "IOS_PHONE"
    }
  },
  "people": [
    { "name": "John Doe" }
  ],
  "favorited": true
}
```

### 2. Known Edge Cases

| Issue | Description |
|-------|-------------|
| **46-char filename limit** | JSON filenames are truncated to 46 characters |
| **Localized names** | `metadata.json`, `métadonnées.json`, `metadatos.json`, etc. |
| **Split archives** | Images and JSON may be in different ZIP files |
| **Missing sidecars** | Some files lack corresponding JSON metadata |
| **Duplicate suffixes** | `photo(1).jpg` matches `photo.jpg.supplemental-metadata(1).json` |
| **Stripped EXIF** | Google removes EXIF from exports; data only in JSON |
| **Live Photos** | Single JSON for image; video has no companion JSON |
| **Motion Photos** | MP4 embedded in HEIC requires special extraction |

## Immich Architecture Analysis

### Current Import Mechanisms

1. **CLI Upload** (`/home/user/immich/cli/src/commands/asset.ts`)
   - Crawls directories for media files
   - Detects XMP sidecars (`photo.xmp`, `photo.jpg.xmp`)
   - Uploads via `/assets` endpoint with optional sidecar

2. **Library Import** (`/home/user/immich/server/src/services/library.service.ts`)
   - External directory watching
   - References files in-place (no copy)
   - Discovers XMP sidecars during metadata extraction

3. **Metadata Extraction** (`/home/user/immich/server/src/services/metadata.service.ts`)
   - ExifTool-based EXIF reading
   - XMP sidecar priority over embedded EXIF
   - Job-based async processing

### Key Integration Points

| Component | File | Purpose |
|-----------|------|---------|
| Upload Endpoint | `server/src/controllers/asset-media.controller.ts` | Accepts assets + sidecars |
| Metadata Service | `server/src/services/metadata.service.ts` | EXIF extraction pipeline |
| Sidecar Check Job | `server/src/services/metadata.service.ts:348` | Discovers sidecar files |
| CLI Upload | `cli/src/commands/asset.ts` | Client-side upload logic |

## Integration Approaches

### Option 1: CLI Command Extension (Recommended)

Add a new `upload-google-takeout` command to the Immich CLI.

```
immich upload-google-takeout [paths...] [options]
  --server <url>     Immich server URL
  --key <key>        API key
  --album            Create albums from Google Photos album structure
  --dry-run          Preview without uploading
  --merge-json       Merge JSON metadata into XMP before upload
```

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLI: upload-google-takeout                     │
├─────────────────┬─────────────────┬─────────────────┬────────────────┤
│  TakeoutParser  │  JSONMatcher    │  MetadataMerger │  Uploader      │
│  - Extract ZIPs │  - Match JSON   │  - JSON→EXIF    │  - Existing    │
│  - Find media   │  - Handle edge  │  - Generate XMP │  - upload()    │
│  - Find JSON    │    cases        │  - Live photos  │                │
└─────────────────┴─────────────────┴─────────────────┴────────────────┘
```

#### Implementation Steps

1. **TakeoutParser Module** (`cli/src/google-takeout/parser.ts`)
   ```typescript
   interface TakeoutAsset {
     mediaPath: string;
     jsonPath?: string;
     albumName?: string;
     metadata?: GooglePhotosMetadata;
   }

   async function* parseTakeout(paths: string[]): AsyncGenerator<TakeoutAsset>
   ```

2. **JSONMatcher Module** (`cli/src/google-takeout/matcher.ts`)
   - Handle 46-char truncation
   - Support localized metadata filenames
   - Match `photo(1).jpg` to `photo.jpg.supplemental-metadata(1).json`
   - Handle cross-ZIP matching for split archives

3. **MetadataMerger Module** (`cli/src/google-takeout/merger.ts`)
   - Convert Google JSON timestamps to EXIF format
   - Map `geoData` to GPS EXIF tags
   - Convert `people` to XMP face regions
   - Generate XMP sidecar for upload

4. **Extend uploadFile()** (`cli/src/commands/asset.ts:362`)
   - Accept pre-generated XMP content
   - Pass merged metadata to server

#### Pros
- Minimal server changes
- Leverages existing upload infrastructure
- Users get native CLI experience
- Can be iterated independently

#### Cons
- Requires Node.js (unlike immich-go)
- Client-side processing load

---

### Option 2: Server-Side Import Service

Add a dedicated Google Takeout import endpoint/service.

```
POST /import/google-takeout
Content-Type: multipart/form-data

{
  files: [takeout-001.zip, takeout-002.zip, ...]
}
```

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Server Side                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  GoogleTakeoutController           GoogleTakeoutService                      │
│  POST /import/google-takeout  ──▶  - Extract ZIPs to temp                   │
│                                    - Parse structure                         │
│                                    - Queue import jobs                       │
│                                         │                                    │
│                                         ▼                                    │
│                               ┌─────────────────────┐                        │
│                               │  GoogleTakeoutJob   │                        │
│                               │  - Match JSON/media │                        │
│                               │  - Merge metadata   │                        │
│                               │  - Create asset     │                        │
│                               │  - Create albums    │                        │
│                               └─────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Implementation Files

1. `server/src/controllers/google-takeout.controller.ts`
2. `server/src/services/google-takeout.service.ts`
3. `server/src/jobs/google-takeout.processor.ts`
4. `server/src/dtos/google-takeout.dto.ts`

#### Pros
- Web UI integration possible
- Centralized processing
- Better for large imports
- Could stream-process ZIPs

#### Cons
- Significant server complexity
- Storage requirements for temp extraction
- More invasive changes

---

### Option 3: Library Import Enhancement

Extend the existing library import to recognize Google Takeout structure.

#### Approach
1. Add `GoogleTakeoutAdapter` alongside existing library import
2. Detect Takeout structure automatically
3. Prefer JSON metadata over embedded EXIF
4. Map album folders to Immich albums

#### Server Changes

```typescript
// server/src/services/library.service.ts
interface ImportAdapter {
  detect(path: string): Promise<boolean>;
  getAssets(path: string): AsyncGenerator<ImportAsset>;
}

class GoogleTakeoutAdapter implements ImportAdapter {
  async detect(path: string): Promise<boolean> {
    // Check for Takeout/Google Photos structure
  }

  async *getAssets(path: string): AsyncGenerator<ImportAsset> {
    // Yield assets with merged metadata
  }
}
```

#### Pros
- Leverages existing library infrastructure
- Familiar user workflow
- Minimal new API surface

#### Cons
- Libraries are external (referenced, not copied)
- Doesn't handle ZIP archives directly
- Would need pre-extraction step

---

### Option 4: Metadata Service Extension

Add Google JSON as a recognized sidecar format alongside XMP.

#### Approach
Modify `handleSidecarCheck()` to also look for `.supplemental-metadata.json`:

```typescript
// server/src/services/metadata.service.ts
async handleSidecarCheck({ id }: AssetJobData) {
  // Existing XMP checks...

  // Add Google JSON check
  const googleJsonPath = `${originalPath}.supplemental-metadata.json`;
  if (await this.storageRepository.checkFileExists(googleJsonPath)) {
    // Parse and merge into asset metadata
  }
}
```

#### Pros
- Simplest server change
- Works with existing upload/library flows
- Automatic for pre-extracted Takeouts

#### Cons
- Doesn't handle the complex matching edge cases
- Requires pre-extraction of ZIPs
- Album structure not preserved

---

## Recommended Implementation Path

### Phase 1: CLI Google Takeout Command (MVP)

1. Create `cli/src/google-takeout/` module
2. Implement TakeoutParser with ZIP support
3. Implement JSONMatcher with edge case handling
4. Generate temporary XMP sidecars from JSON
5. Use existing upload pipeline

**Estimated scope**: ~1500-2000 lines of TypeScript

### Phase 2: Enhanced Metadata Support

1. Add Google JSON as recognized sidecar format in server
2. Extend metadata extraction to read `photoTakenTime`, `geoData`
3. Map `people` array to face regions

**Files to modify**:
- `server/src/services/metadata.service.ts`
- `server/src/repositories/metadata.repository.ts`

### Phase 3: Web UI Integration (Optional)

1. Add import wizard in web interface
2. Support drag-and-drop of Takeout ZIPs
3. Server-side processing via job queue

---

## Comparison with immich-go

| Feature | immich-go | Proposed CLI | Server-side |
|---------|-----------|--------------|-------------|
| No Node.js required | ✅ | ❌ | ✅ |
| ZIP processing | ✅ | ✅ | ✅ |
| Album preservation | ✅ | ✅ | ✅ |
| JSON metadata | ✅ | ✅ | ✅ |
| 46-char edge case | ✅ | ✅ | ✅ |
| Split archive handling | ✅ | ✅ | ✅ |
| Native integration | ❌ | ✅ | ✅ |
| Web UI support | ❌ | ❌ | ✅ |
| Maintenance burden | External | Immich team | Immich team |

---

## Key Implementation Details

### JSON-to-XMP Mapping

```typescript
interface GooglePhotosMetadata {
  title: string;
  description: string;
  photoTakenTime: { timestamp: string; formatted: string };
  geoData: { latitude: number; longitude: number; altitude: number };
  people: Array<{ name: string }>;
  favorited: boolean;
}

function toXMP(meta: GooglePhotosMetadata): string {
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:exif="http://ns.adobe.com/exif/1.0/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <dc:description>${meta.description}</dc:description>
      <exif:DateTimeOriginal>${toExifDate(meta.photoTakenTime.timestamp)}</exif:DateTimeOriginal>
      <exif:GPSLatitude>${toExifGPS(meta.geoData.latitude)}</exif:GPSLatitude>
      <exif:GPSLongitude>${toExifGPS(meta.geoData.longitude)}</exif:GPSLongitude>
      <xmp:Rating>${meta.favorited ? 5 : 0}</xmp:Rating>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
```

### Filename Matching Algorithm

```typescript
function findMatchingJson(mediaPath: string, jsonFiles: Map<string, string>): string | undefined {
  const baseName = path.basename(mediaPath);
  const dir = path.dirname(mediaPath);

  // Try exact match first
  const candidates = [
    `${baseName}.supplemental-metadata.json`,
    `${baseName}.json`,
    // Truncated to 46 chars
    `${baseName.slice(0, 46 - '.supplemental-metadata.json'.length)}.supplemental-metadata.json`,
    // Handle (1), (2) suffixes
    ...generateSuffixVariants(baseName),
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(dir, candidate);
    if (jsonFiles.has(fullPath)) {
      return jsonFiles.get(fullPath);
    }
  }

  // Localized name fallback
  const localizedNames = ['metadata', 'métadonnées', 'metadatos', 'metadades'];
  // ... check localized variants
}
```

---

## References

- [immich-go Repository](https://github.com/simulot/immich-go)
- [Immich Discussion #5083](https://github.com/immich-app/immich/discussions/5083) - Original feature request
- [Immich Discussion #21392](https://github.com/immich-app/immich/discussions/21392) - Recent discussion
- [Google Takeout](https://takeout.google.com) - Export service

---

## Conclusion

The recommended path is **Option 1: CLI Command Extension**, as it:
1. Minimizes server-side changes
2. Leverages existing upload infrastructure
3. Can be developed incrementally
4. Provides native user experience

This approach mirrors what immich-go does but as a native part of the Immich ecosystem, reducing external dependencies for users migrating from Google Photos.
