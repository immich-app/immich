# XMP Sidecars

Immich supports XMP sidecar files — external `.xmp` files that store metadata for an image or video.  
These are commonly used by tools like Lightroom, Darktable, and digiKam to keep the original file untouched.

Immich can:
- **Read** metadata from sidecars during import
- **Write back** changes (e.g. rating, tags) to the `.xmp` file when edited in the web UI

---

![XMP sidecars](./img/xmp-sidecars.webp)

## 1 · What Immich Reads

Only a few XMP fields are saved into the database:

| Stored in DB       | XMP Field                         |
|--------------------|-----------------------------------|
| **Title**          | `dc:title`                        |
| **Description**    | `dc:description`                  |
| **DateTimeOriginal** | `exif:DateTimeOriginal`        |
| **Rating**         | `xmp:Rating`                      |
| **Tags**           | `digiKam:TagsList`, `dc:subject`  |

All other fields (e.g. `Creator`, `Source`, IPTC, Lightroom edits) remain in the `.xmp` file and are **not searchable** in Immich.

---

## 2 · File Naming Rules

A sidecar must share the base name of the media file:

- ✅ `IMG_0001.jpg.xmp` ← preferred
- ✅ `IMG_0001.xmp` ← fallback
- ❌ `myphoto_meta.xmp` ← not recognized

If both `.jpg.xmp` and `.xmp` are present, Immich uses the **`.jpg.xmp`** file.

---

## 3 · How Sidecars Are Handled

### A · Uploaded via CLI

1. **Detect** – Immich looks for a `.xmp` file placed next to each media file during upload.
2. **Copy** – Both the media and the sidecar file are copied into Immich’s internal library folder.  
   The sidecar is renamed to match the internal filename template, e.g.:  
   `upload/library/<user>/YYYY/YYYY-MM-DD/IMG_0001.jpg`  
   `upload/library/<user>/YYYY/YYYY-MM-DD/IMG_0001.jpg.xmp`
3. **Extract** – Selected metadata (title, description, date, rating, tags) is parsed from the sidecar and saved to the database.
4. **Write-back** – If you later update tags, rating, or description in the web UI, Immich will update **both** the database *and* the copied `.xmp` file to stay in sync.

---

### B · External Library (Mounted Folder)

1. **Detect** – The `DISCOVER` job automatically associates `.xmp` files that sit next to existing media files in your mounted folder. No files are moved or renamed.
2. **Extract** – Immich reads and saves the same metadata fields from the sidecar to the database.
3. **Write-back** – If Immich has **write access** to the mount, any future metadata edits (e.g., rating or tags) are also written back to the original `.xmp` file on disk.  
   ❗ If the mount is **read-only**, Immich cannot update either the sidecar **or** the database — **metadata edits will silently fail** with no warning.  
   See [Issue #10538](https://github.com/immich-app/immich/issues/10538) for details.

---

## 4 · Admin Jobs

Immich provides two admin jobs for managing sidecars:

| Job       | What it does |
|-----------|--------------|
| `DISCOVER` | Finds new `.xmp` files next to media that don’t already have one linked |
| `SYNC`     | Re-reads existing `.xmp` files and refreshes metadata in the database (e.g. after external edits) |

![Sidecar Admin Jobs](./img/sidecar-jobs.webp)
