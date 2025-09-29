import { LoginResponseDto } from '@immich/sdk';
import { createHash, randomBytes } from 'node:crypto';
import { createUserDto } from 'src/fixtures';
import { app, baseUrl, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/upload (RUFH compliance)', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let base64Metadata: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    user = await utils.userSetup(admin.accessToken, createUserDto.create('upload-test'));
    base64Metadata = Buffer.from(
      JSON.stringify({
        filename: 'test-image.jpg',
        deviceAssetId: 'rufh',
        deviceId: 'test',
        fileCreatedAt: new Date('2025-01-02T00:00:00Z').toISOString(),
        fileModifiedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
        isFavorite: false,
      }),
    ).toString('base64');
  });

  describe('Upload Creation (Section 4.2)', () => {
    it('should create a complete upload with Upload-Complete: ?1', async () => {
      const content = randomBytes(1024);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .send(content);

      expect(status).toBe(200);
      expect(headers['upload-complete']).toBe('?1');
      expect(headers['upload-limit']).toEqual('min-size=0');
    });

    it('should create an incomplete upload with Upload-Complete: ?0', async () => {
      const partialContent = randomBytes(512);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(partialContent).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Content-Length', partialContent.length.toString())
        .send(partialContent);

      expect(status).toBe(201);
      expect(headers['upload-limit']).toEqual('min-size=0');
      expect(headers['location']).toMatch(/^\/api\/upload\/[a-zA-Z0-9\-]+$/);
    });
  });

  describe('Offset Retrieval (Section 4.3)', () => {
    let uploadResource: string;

    beforeAll(async () => {
      const content = randomBytes(512);
      // Create an incomplete upload first
      const { headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .send(content);

      uploadResource = headers['location'];
    });

    it('should retrieve upload offset with HEAD request', async () => {
      const { status, headers } = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(status).toBe(204);
      expect(headers['upload-offset']).toBe('512');
      expect(headers['upload-complete']).toBe('?0');
      expect(headers['upload-limit']).toEqual('min-size=0');
      expect(headers['cache-control']).toBe('no-store');
    });

    it('should return 400 for non-UUID upload resource', async () => {
      const { status } = await request(app)
        .head('/upload/nonexistent')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent upload resource', async () => {
      const { status } = await request(app)
        .head('/upload/4feacf6f-830f-46c8-8140-2b3da67070c0')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(status).toBe(404);
    });
  });

  describe('Upload Append (Section 4.4)', () => {
    let uploadResource: string;
    let chunks: Buffer[];

    beforeAll(async () => {
      // Create an incomplete upload
      chunks = [randomBytes(750), randomBytes(500), randomBytes(1500)];
      const fullContent = Buffer.concat(chunks);
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(fullContent).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .send(chunks[0]);

      uploadResource = response.headers['location'];
    });

    it('should append data with correct offset', async () => {
      const { status, headers } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', chunks[0].length.toString())
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(status).toBe(204);
      expect(headers['upload-complete']).toBe('?0');

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(headResponse.headers['upload-offset']).toBe('1250');
    });

    it('should reject append with mismatching offset (409 Conflict)', async () => {
      const wrongOffset = 100;

      const { status, headers, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', wrongOffset.toString())
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(randomBytes(100));

      expect(status).toBe(409);
      expect(headers['upload-offset']).toBe('1250');
      expect(body.type).toBe('https://iana.org/assignments/http-problem-types#mismatching-upload-offset');
      expect(body['expected-offset']).toBe(1250);
      expect(body['provided-offset']).toBe(wrongOffset);
    });

    it('should complete upload with Upload-Complete: ?1', async () => {
      // Get current offset first
      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      const offset = parseInt(headResponse.headers['upload-offset']);
      expect(offset).toBe(1250);

      const { status, headers } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', offset.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[2]);

      expect(status).toBe(200);
      expect(headers['upload-complete']).toBe('?1');
      expect(headers['upload-offset']).toBe('2750');
    });

    it('should reject append to completed upload when offset is right', async () => {
      const { status, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', '2750')
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(randomBytes(100));

      expect(status).toBe(400);
      expect(body.type).toBe('https://iana.org/assignments/http-problem-types#completed-upload');
    });
  });

  describe('Upload Cancellation (Section 4.5)', () => {
    let uploadResource: string;

    beforeAll(async () => {
      const content = randomBytes(200);
      // Create an incomplete upload
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .send(content);

      uploadResource = response.headers['location'];
    });

    it('should cancel upload with DELETE request', async () => {
      const { status } = await request(baseUrl)
        .delete(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(status).toBe(204);

      // Verify resource is no longer accessible
      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(headResponse.status).toBe(404);
    });
  });

  describe('Interrupted Upload Scenarios', () => {
    it('should handle interrupted initial upload and resume', async () => {
      // Simulate interrupted upload by sending partial content
      const totalContent = randomBytes(5000);
      const firstPart = totalContent.subarray(0, 2000);

      // Initial upload with interruption
      const initialResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(totalContent).digest('base64')}:`)
        .set('Upload-Complete', '?0') // Indicate incomplete
        .send(firstPart);

      expect(initialResponse.status).toBe(201);
      const uploadResource = initialResponse.headers['location'];

      // Check offset after interruption
      const offsetResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(offsetResponse.headers['upload-offset']).toBe('2000');

      // Resume upload
      const remainingContent = totalContent.subarray(2000);
      const resumeResponse = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', '2000')
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(remainingContent);

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.headers['upload-complete']).toBe('?1');
    });

    it('should handle multiple interruptions and resumptions', async () => {
      const chunks = [randomBytes(2000), randomBytes(3000), randomBytes(5000)];
      const hash = createHash('sha1');
      chunks.forEach((chunk) => hash.update(chunk));

      // Create initial upload
      const createResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${hash.digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .send(chunks[0]);

      const uploadResource = createResponse.headers['location'];
      let currentOffset = 2000;

      // First resumption
      let response = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', currentOffset.toString())
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(response.status).toBe(204);
      currentOffset += 3000;

      // Verify offset
      const offsetCheck = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(offsetCheck.headers['upload-offset']).toBe('5000');

      // Final resumption
      response = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Offset', currentOffset.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[2]);

      expect(response.status).toBe(200);
      expect(response.headers['upload-complete']).toBe('?1');
    });
  });

  describe('Inconsistent Length Scenarios', () => {
    it('should reject when Upload-Complete: ?1 with mismatching Content-Length and Upload-Length', async () => {
      const content = randomBytes(1000);

      const { status, body } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Immich-Asset-Data', base64Metadata)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '2000') // Doesn't match content length
        .set('Content-Length', content.length.toString())
        .send(content);

      expect(status).toBe(400);
      expect(body.type).toBe('https://iana.org/assignments/http-problem-types#inconsistent-upload-length');
    });
  });

  describe('Limit Enforcement', () => {
    it('should include Upload-Limit in OPTIONS response', async () => {
      const { status, headers } = await request(app)
        .options('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(status).toBe(204);
      expect(headers['upload-limit']).toBeDefined();

      const limits = parseUploadLimit(headers['upload-limit']);
      expect(limits).toHaveProperty('min-size');
    });
  });
});

// Helper function to parse Upload-Limit header
function parseUploadLimit(headerValue: string): Record<string, number> {
  const limits: Record<string, number> = {};
  if (!headerValue) return limits;

  // Parse structured field dictionary format
  const pairs = headerValue.split(',').map((p) => p.trim());
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      limits[key] = parseInt(value, 10);
    }
  }

  return limits;
}
