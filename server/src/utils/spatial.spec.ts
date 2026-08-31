import { isSpatialMedia, type ByteReader } from 'src/utils/spatial';
import { describe, expect, it } from 'vitest';

const box = (type: string, ...payload: Buffer[]) => {
  const body = Buffer.concat(payload);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length + 8, 0);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
};

/** version + flags */
const fullBox = (type: string, ...payload: Buffer[]) => box(type, Buffer.alloc(4), ...payload);

const uint32 = (value: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
};

/** an entity group listing `count` members, the shape Apple uses to pair the two eye images */
const ster = (count: number) => fullBox('ster', uint32(1), uint32(count), ...Array.from({ length: count }, uint32));

/** `stri` carries the eye-view bits: 0b01 left, 0b10 right, 0b11 both */
const vexu = (views: number) => box('vexu', box('eyes', fullBox('stri', Buffer.from([views]))));

const heic = (...groups: Buffer[]) =>
  Buffer.concat([box('ftyp', Buffer.from('heic')), fullBox('meta', box('grpl', ...groups))]);

/** a visual sample entry: 78 bytes of fixed fields, then child boxes */
const sampleEntry = (type: string, ...children: Buffer[]) => box(type, Buffer.alloc(78), ...children);

const mov = (...children: Buffer[]) =>
  Buffer.concat([
    box('ftyp', Buffer.from('qt  ')),
    box('mdat', Buffer.alloc(64)),
    box('moov', box('trak', box('mdia', box('minf', box('stbl', fullBox('stsd', uint32(1), ...children)))))),
  ]);

const read = (buffer: Buffer) => {
  const reader: ByteReader = {
    size: buffer.length,
    read: (position, length) => Promise.resolve(buffer.subarray(position, position + length)),
  };
  return isSpatialMedia(reader);
};

describe('isSpatialMedia', () => {
  describe('spatial photos', () => {
    it('should detect a stereo pair entity group', async () => {
      await expect(read(heic(ster(2)))).resolves.toBe(true);
    });

    it('should ignore a group with a single entity', async () => {
      await expect(read(heic(ster(1)))).resolves.toBe(false);
    });

    it('should ignore a group with more than two entities', async () => {
      await expect(read(heic(ster(3)))).resolves.toBe(false);
    });

    it('should ignore a group whose entity list is truncated', async () => {
      const truncated = fullBox('ster', uint32(1), uint32(2));
      await expect(read(heic(truncated))).resolves.toBe(false);
    });

    it('should ignore other kinds of entity group', async () => {
      await expect(read(heic(fullBox('altr', uint32(1), uint32(2), uint32(1), uint32(2))))).resolves.toBe(false);
    });

    it('should handle a file with no groups at all', async () => {
      await expect(read(Buffer.concat([box('ftyp', Buffer.from('heic')), fullBox('meta')]))).resolves.toBe(false);
    });
  });

  describe('spatial videos', () => {
    it('should detect a layered track declaring both eyes', async () => {
      await expect(read(mov(sampleEntry('hvc1', box('lhvC'), vexu(0b11))))).resolves.toBe(true);
    });

    it('should ignore a single-view codec that kept a stale vexu box', async () => {
      // re-encoding a spatial video can carry `vexu` over without a second coded view
      await expect(read(mov(sampleEntry('avc1', vexu(0b11))))).resolves.toBe(false);
    });

    it('should ignore a layered track that declares only one eye', async () => {
      await expect(read(mov(sampleEntry('hvc1', box('lhvC'), vexu(0b01))))).resolves.toBe(false);
    });

    it('should ignore a plain track', async () => {
      await expect(read(mov(sampleEntry('hvc1', box('hvcC'))))).resolves.toBe(false);
    });

    it('should find the marker when moov trails the media data', async () => {
      await expect(read(mov(sampleEntry('hvc1', box('lhvC'), vexu(0b11))))).resolves.toBe(true);
    });
  });

  describe('malformed input', () => {
    it('should handle an empty file', async () => {
      await expect(read(Buffer.alloc(0))).resolves.toBe(false);
    });

    it('should handle a file that is not ISOBMFF at all', async () => {
      await expect(read(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]))).resolves.toBe(false);
    });

    it('should stop on a box that overruns the file', async () => {
      const truncated = box('moov', box('trak'));
      truncated.writeUInt32BE(0xff_ff_ff, 0);
      await expect(read(truncated)).resolves.toBe(false);
    });

    it('should not loop on a zero-length box', async () => {
      const degenerate = Buffer.concat([uint32(0), Buffer.from('moov')]);
      await expect(read(degenerate)).resolves.toBe(false);
    });
  });
});
