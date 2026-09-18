/**
 * Minimal ISOBMFF scanner used to detect Apple spatial (stereoscopic) media.
 * HEIC and QuickTime/MP4 are both ISOBMFF, so one box walker covers stills and video.
 *
 * Spatial photo: `meta` -> `grpl` -> `ster`, an entity group pairing the two eye images.
 * Spatial video: a visual sample entry carrying both `lhvC` (layered HEVC, i.e. a second
 * coded view) and `vexu` -> `eyes` -> `stri` with both eye bits set.
 *
 * `vexu` on its own is not enough: re-encoding a spatial video to a single-view codec can
 * carry the box across, leaving a 2D file that still advertises two eyes. Requiring the
 * layered-codec box alongside it keeps those out.
 *
 * Neither marker is reachable through exiftool -- it has no `vexu` support and parses
 * `grpl` as an opaque `Unknown_grpl` -- so the boxes are read directly.
 */

/** size (4) + type (4) */
const HEADER_SIZE = 8;
/** header plus the 64-bit largesize that follows a size of 1 */
const LARGE_HEADER_SIZE = 16;
/** version (1) + flags (3) at the front of a FullBox payload */
const FULL_BOX_SIZE = 4;
/** VisualSampleEntry fields preceding any child boxes */
const VISUAL_SAMPLE_ENTRY_SIZE = 78;
/** entry_count preceding the sample entries in `stsd` */
const SAMPLE_ENTRY_COUNT_SIZE = 4;
/** each entity ID in an EntityToGroupBox is a 32-bit value */
const ENTITY_ID_SIZE = 4;
/** guards against buffering a pathologically large `moov`/`meta` */
const MAX_CONTAINER_SIZE = 32 * 1024 * 1024;
/** both eye-view bits of `stri` */
const STRI_BOTH_EYES = 0b11;

/** sample entries whose payload starts with the VisualSampleEntry fields */
const VISUAL_SAMPLE_ENTRIES = new Set(['hvc1', 'hev1', 'avc1', 'avc3', 'av01', 'dvh1', 'dvhe']);

export interface ByteReader {
  size: number;
  read(position: number, length: number): Promise<Buffer>;
}

interface Box {
  type: string;
  /** offset of the box header */
  start: number;
  /** offset just past the box */
  end: number;
  /** offset of the box payload */
  body: number;
}

const isPrintableType = (type: string) => /^[\w -]{4}$/.test(type);

/** Walks the boxes laid out between `start` and `end` of an in-memory buffer. */
function* boxes(buffer: Buffer, start: number, end: number): Generator<Box> {
  let position = start;
  while (position + HEADER_SIZE <= end) {
    let size = buffer.readUInt32BE(position);
    let body = position + HEADER_SIZE;
    const type = buffer.toString('latin1', position + 4, position + HEADER_SIZE);

    if (size === 1) {
      if (position + LARGE_HEADER_SIZE > end) {
        return;
      }
      // only the low half is usable as a buffer offset, and a metadata box never
      // approaches 4GiB, so anything larger is malformed for our purposes
      const high = buffer.readUInt32BE(position + HEADER_SIZE);
      if (high !== 0) {
        return;
      }
      size = buffer.readUInt32BE(position + HEADER_SIZE + 4);
      body = position + LARGE_HEADER_SIZE;
    } else if (size === 0) {
      size = end - position;
    }

    if (size < body - position || position + size > end || !isPrintableType(type)) {
      return;
    }

    yield { type, start: position, end: position + size, body };
    position += size;
  }
}

const findBox = (buffer: Buffer, start: number, end: number, type: string): Box | undefined => {
  for (const box of boxes(buffer, start, end)) {
    if (box.type === type) {
      return box;
    }
  }
};

/**
 * `meta` is a FullBox in ISO/HEIF but a plain container in some QuickTime files, so the
 * payload offset is confirmed against the first child rather than assumed.
 */
const metaBody = (buffer: Buffer, box: Box): number => {
  const withFullBox = box.body + FULL_BOX_SIZE;
  const first = boxes(buffer, withFullBox, box.end).next();
  return first.done ? box.body : withFullBox;
};

/** A `ster` entity group pairs the left and right images of a spatial photo. */
const hasStereoPairGroup = (buffer: Buffer, meta: Box): boolean => {
  const grpl = findBox(buffer, metaBody(buffer, meta), meta.end, 'grpl');
  if (!grpl) {
    return false;
  }

  for (const group of boxes(buffer, grpl.body, grpl.end)) {
    // EntityToGroupBox: version/flags, group_id, num_entities_in_group
    const countAt = group.body + FULL_BOX_SIZE + 4;
    if (group.type !== 'ster' || countAt + 4 > group.end) {
      continue;
    }

    const count = buffer.readUInt32BE(countAt);
    const entitiesAt = countAt + 4;
    if (count === 2 && entitiesAt + count * ENTITY_ID_SIZE <= group.end) {
      return true;
    }
  }

  return false;
};

/** `vexu` -> `eyes` -> `stri` describes which eye views the track carries. */
const hasBothEyeViews = (buffer: Buffer, entry: Box): boolean => {
  const vexu = findBox(buffer, entry.body + VISUAL_SAMPLE_ENTRY_SIZE, entry.end, 'vexu');
  const eyes = vexu && findBox(buffer, vexu.body, vexu.end, 'eyes');
  const stri = eyes && findBox(buffer, eyes.body, eyes.end, 'stri');
  if (!stri) {
    return false;
  }

  const viewsAt = stri.body + FULL_BOX_SIZE;
  return viewsAt < stri.end && (buffer.readUInt8(viewsAt) & STRI_BOTH_EYES) === STRI_BOTH_EYES;
};

/** `lhvC` configures the second coded layer, so its presence means a real second view. */
const hasLayeredView = (buffer: Buffer, entry: Box): boolean =>
  !!findBox(buffer, entry.body + VISUAL_SAMPLE_ENTRY_SIZE, entry.end, 'lhvC');

const hasStereoTrack = (buffer: Buffer, moov: Box): boolean => {
  for (const trak of boxes(buffer, moov.body, moov.end)) {
    if (trak.type !== 'trak') {
      continue;
    }

    const mdia = findBox(buffer, trak.body, trak.end, 'mdia');
    const minf = mdia && findBox(buffer, mdia.body, mdia.end, 'minf');
    const stbl = minf && findBox(buffer, minf.body, minf.end, 'stbl');
    const stsd = stbl && findBox(buffer, stbl.body, stbl.end, 'stsd');
    if (!stsd) {
      continue;
    }

    const entries = stsd.body + FULL_BOX_SIZE + SAMPLE_ENTRY_COUNT_SIZE;
    for (const entry of boxes(buffer, entries, stsd.end)) {
      if (VISUAL_SAMPLE_ENTRIES.has(entry.type) && hasLayeredView(buffer, entry) && hasBothEyeViews(buffer, entry)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Reports whether the file declares stereoscopic content, reading only the top-level box
 * headers plus whichever metadata container holds the markers -- never the media payload.
 */
export const isSpatialMedia = async (reader: ByteReader): Promise<boolean> => {
  let position = 0;

  while (position + HEADER_SIZE <= reader.size) {
    const header = await reader.read(position, LARGE_HEADER_SIZE);
    if (header.length < HEADER_SIZE) {
      return false;
    }

    let size = header.readUInt32BE(0);
    const type = header.toString('latin1', 4, HEADER_SIZE);

    if (size === 1) {
      if (header.length < LARGE_HEADER_SIZE || header.readUInt32BE(HEADER_SIZE) !== 0) {
        return false;
      }
      size = header.readUInt32BE(HEADER_SIZE + 4);
    } else if (size === 0) {
      size = reader.size - position;
    }

    if (size < HEADER_SIZE || position + size > reader.size || !isPrintableType(type)) {
      return false;
    }

    // `mdat` holds the media itself; the markers live in `meta` (stills) and `moov` (video)
    if ((type === 'meta' || type === 'moov') && size <= MAX_CONTAINER_SIZE) {
      const buffer = await reader.read(position, size);
      const box = boxes(buffer, 0, buffer.length).next();
      if (!box.done) {
        const found = type === 'meta' ? hasStereoPairGroup(buffer, box.value) : hasStereoTrack(buffer, box.value);
        if (found) {
          return true;
        }
      }
    }

    position += size;
  }

  return false;
};
