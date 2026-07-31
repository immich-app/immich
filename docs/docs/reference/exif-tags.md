# EXIF tags

During the [Metadata Extraction](/reference/jobs#extract-metadata) job, Immich reads metadata from each asset with [ExifTool](https://exiftool.org/) and, for videos, supplements it with stream information from [ffprobe](https://ffmpeg.org/ffprobe.html). This page lists which tags feed which feature.

Where several tags are listed for one field, they are tried **in order** and the first one present is used. Tags read from an [XMP sidecar](/reference/xmp-sidecars) take precedence over tags embedded in the asset itself.

## Date and time

The asset's date is taken from the first of these tags that contains a valid date:

1. `SubSecDateTimeOriginal`
2. `SubSecCreateDate`
3. `DateTimeOriginal`
4. `CreationDate`
5. `CreateDate`
6. `MediaCreateDate`
7. `DateTimeCreated`
8. `GPSDateTime`
9. `DateTimeUTC`
10. `SonyDateTime2`
11. `SourceImageCreateTime` — undocumented, non-standard tag written by Insta360 in the `xmp.GPano` namespace

If none of them yields a date, Immich falls back to the **earliest of the file's creation and modification times**. This is why assets with no date metadata often show up dated by when the file was copied or created.

The time zone comes from the offset on whichever date tag was used. A raw value ending in `Z` or `+00:00` is treated as `UTC+0`. If no zone can be determined, the timestamp is stored as-is and treated as local time.

## Location

| Field                  | Tags                          |
| ---------------------- | ----------------------------- |
| Latitude and longitude | `GPSLatitude`, `GPSLongitude` |

Coordinates are ignored when both values are `0`, which is how many devices write "no fix". City, state, and country are not read from the file — they are derived from the coordinates by [reverse geocoding](/concepts/reverse-geocoding).

## Camera and lens

| Field         | Tags (in order)                                                    |
| ------------- | ------------------------------------------------------------------ |
| Make          | `Make`, `Device.Manufacturer`, `AndroidMake`, `DeviceManufacturer` |
| Model         | `Model`, `Device.ModelName`, `AndroidModel`, `DeviceModelName`     |
| Lens model    | `LensID`, `LensType`, `LensSpec`, `LensModel`                      |
| ISO           | `ISO`                                                              |
| Exposure time | `ExposureTime`                                                     |
| Aperture      | `FNumber`                                                          |
| Focal length  | `FocalLength`                                                      |
| Frame rate    | ffprobe frame rate, else `VideoFrameRate`                          |

A lens model of `----`, or one beginning with `Unknown`, is discarded rather than stored.

## Image properties

| Field           | Tags (in order)                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| Dimensions      | `ImageSize`, else `ImageWidth` and `ImageHeight`                                     |
| Orientation     | `Orientation`                                                                        |
| Projection type | `ProjectionType`                                                                     |
| Bits per sample | `BitsPerSample`, `ComponentBitDepth`, `ImagePixelDepth`, `BitDepth`, `ColorBitDepth` |
| Color space     | `ColorSpace`                                                                         |
| Duration        | `Duration`                                                                           |

`ImageSize` is preferred because for RAW formats such as CR2 and RAF, `ImageWidth` and `ImageHeight` describe the embedded preview rather than the image itself.

When `Orientation` indicates the image is rotated a quarter turn, the stored width and height are swapped so the asset's dimensions match how it is displayed.

A bit depth of 24 or more that divides evenly by three is treated as a per-pixel value and divided by three to get bits per channel.

`ProjectionType` is what marks an asset as a 360° photo.

## Description and rating

| Field               | Tags (in order)                   |
| ------------------- | --------------------------------- |
| Description         | `ImageDescription`, `Description` |
| Profile description | `ProfileDescription`              |
| Rating              | `Rating`                          |

Ratings are accepted in the range 1–5; a rating of `0` is stored as no rating.

## Tags

| Field | Tags (in order)                               | Used for                                                                   |
| ----- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Tags  | `TagsList`, `HierarchicalSubject`, `Keywords` | [Tagging](/user-guide/use-tags), including [hierarchy](#hierarchical-tags) |

Only the first of the three that is present is used — they are not merged. `TagsList` (written by digiKam and others) is the preferred source because it already carries hierarchy. `HierarchicalSubject` (written by Lightroom) is converted as described below, and `Keywords` is a flat list.

### Hierarchical tags

Immich stores tag hierarchy in a single string per tag, using `/` as the level separator. When a tag is applied, the value is split on `/` and every level is created as a real tag, with each level parented to the one before it.

The tag `Nature/Birds/Owl` therefore produces three tags:

| Tag value          | Parent         |
| ------------------ | -------------- |
| `Nature`           | —              |
| `Nature/Birds`     | `Nature`       |
| `Nature/Birds/Owl` | `Nature/Birds` |

and the asset is assigned the deepest one, `Nature/Birds/Owl`. Empty segments are dropped, so `Nature//Owl` is the same as `Nature/Owl`.

`HierarchicalSubject` uses `|` as its separator instead, so its values are converted on import:

- `|` becomes `/`, making each level a level in Immich.
- A literal `/` already inside a level is replaced with `|`, so it does not create an unintended extra level.

For example, Lightroom's `Travel|Roadtrip 2024|Route 66/Arizona` is imported as `Travel/Roadtrip 2024/Route 66|Arizona` — three levels, with the slash in the last one preserved as a `|`.

Because splitting happens on the way in, a flat `Keywords` entry that happens to contain a `/` is also treated as a hierarchy.

## Grouping

| Feature                | Tags (in order)                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Live photo pairing     | `ContentIdentifier`, `MediaGroupUUID`                                                                                               |
| Automatic stacking     | `BurstID`, `BurstUUID`, `CameraBurstID`, `MediaUniqueID`                                                                            |
| Motion photo detection | `MotionPhoto`, `MicroVideo`, `MicroVideoOffset`, `MotionPhotoVideo`, `EmbeddedVideoType`, `EmbeddedVideoFile`, `ContainerDirectory` |

Live photo pairing matches a still and a video that share the same identifier. Automatic stacking groups assets that a camera wrote with the same burst identifier. For motion photos, the embedded video is extracted into a separate asset and linked to the still.

## Faces

| Field        | Tag          |
| ------------ | ------------ |
| Tagged faces | `RegionInfo` |

`RegionInfo` is only read when **Import faces from metadata** is enabled in the machine learning settings. It is used when it contains both `AppliedToDimensions` and a non-empty `RegionList`; region coordinates are interpreted as normalized values per the MWG guidelines and are rotated to match the asset's `Orientation`.

## Tags Immich writes

The [Sidecar Write](/reference/jobs#sidecar-metadata) job writes these tags back to the asset's `.xmp` sidecar:

| Tag                               | Source                    |
| --------------------------------- | ------------------------- |
| `Description`, `ImageDescription` | The asset's description   |
| `DateTimeOriginal`                | The asset's date and time |
| `GPSLatitude`, `GPSLongitude`     | The asset's location      |
| `Rating`                          | The asset's rating        |
| `TagsList`                        | The asset's tags          |

Nothing is written back into the original file. See [XMP Sidecars](/reference/xmp-sidecars) for how sidecar files are discovered and named.
