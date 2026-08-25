import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { StorageTargetKind } from 'src/enum';
import { RemoteStorageDriver } from 'src/repositories/remote-storage/driver';
import { LocalDriver } from 'src/repositories/remote-storage/local.driver';
import { S3Driver } from 'src/repositories/remote-storage/s3.driver';
import { WebDavDriver } from 'src/repositories/remote-storage/webdav.driver';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { beforeAll, describe, expect, it } from 'vitest';

// Nextcloud round-trips are considerably slower than S3 or the local filesystem.
const TIMEOUT = 30_000;

const read = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

const collect = async (driver: RemoteStorageDriver, prefix?: string) => {
  const keys: string[] = [];
  for await (const batch of driver.list(prefix)) {
    keys.push(...batch.map(({ key }) => key));
  }
  return keys.sort();
};

/**
 * The same contract exercised against every backend, so a new driver only has
 * to be added to the table below to be held to the same behavior.
 */
const itBehavesLikeADriver = (name: string, getDriver: () => RemoteStorageDriver) => {
  describe(name, () => {
    it(
      'should pass its own connection test',
      async () => {
        await expect(getDriver().test()).resolves.not.toThrow();
      },
      TIMEOUT,
    );

    it(
      'should round-trip an object',
      async () => {
        const driver = getDriver();
        const key = 'alice/2026/IMG_0001.jpg';

        await driver.upload(key, Readable.from([Buffer.from('hello immich')]), { size: 12 });

        const head = await driver.head(key);
        expect(head).not.toBeNull();
        expect(head!.key).toBe(key);
        expect(head!.size).toBe(12);

        await expect(read(await driver.createReadStream(key))).resolves.toBe('hello immich');

        await driver.delete(key);
        await expect(driver.head(key)).resolves.toBeNull();
      },
      TIMEOUT,
    );

    it(
      'should create intermediate directories on upload',
      async () => {
        const driver = getDriver();
        const key = 'deeply/nested/path/IMG_0002.jpg';

        await driver.upload(key, Readable.from([Buffer.from('nested')]), { size: 6 });

        await expect(driver.head(key)).resolves.toMatchObject({ key });

        await driver.delete(key);
      },
      TIMEOUT,
    );

    it(
      'should return null for a missing object rather than throwing',
      async () => {
        await expect(getDriver().head('does/not/exist.jpg')).resolves.toBeNull();
      },
      TIMEOUT,
    );

    it(
      'should treat deleting a missing object as a no-op',
      async () => {
        await expect(getDriver().delete('does/not/exist.jpg')).resolves.not.toThrow();
      },
      TIMEOUT,
    );

    it(
      'should list objects as keys relative to the prefix',
      async () => {
        const driver = getDriver();
        await driver.upload('listing/a.jpg', Readable.from([Buffer.from('a')]), { size: 1 });
        await driver.upload('listing/nested/b.jpg', Readable.from([Buffer.from('b')]), { size: 1 });

        await expect(collect(driver, 'listing')).resolves.toEqual(['listing/a.jpg', 'listing/nested/b.jpg']);

        await driver.delete('listing/a.jpg');
        await driver.delete('listing/nested/b.jpg');
      },
      TIMEOUT,
    );

    it(
      'should handle concurrent uploads into the same directory',
      async () => {
        const driver = getDriver();
        const keys = Array.from({ length: 5 }, (_, index) => `concurrent/burst/IMG_${index}.jpg`);

        // Every export worker writes under the same owner folder, so they all
        // race to create it. WebDAV servers answer the losers with 405 (it now
        // exists) or 423 (the collection is briefly locked), neither of which
        // should fail the upload.
        await Promise.all(
          keys.map((key) => driver.upload(key, Readable.from([Buffer.from(key)]), { size: key.length })),
        );

        for (const key of keys) {
          await expect(driver.head(key)).resolves.toMatchObject({ key });
        }

        await Promise.all(keys.map((key) => driver.delete(key)));
      },
      TIMEOUT,
    );

    it(
      'should refuse keys that try to escape the prefix',
      async () => {
        await expect(getDriver().head('../../etc/passwd')).rejects.toThrow(/Unsafe object key/);
      },
      TIMEOUT,
    );
  });
};

describe('RemoteStorageDriver', () => {
  describe('LocalDriver', () => {
    let driver: LocalDriver;

    beforeAll(async () => {
      const basePath = await mkdtemp(join(tmpdir(), 'immich-local-driver-'));
      driver = new LocalDriver({
        config: { kind: StorageTargetKind.Local, basePath, prefix: 'immich' },
        secret: { kind: StorageTargetKind.Local },
      });

      return async () => {
        await rm(basePath, { recursive: true, force: true });
      };
    });

    itBehavesLikeADriver('local', () => driver);
  });

  describe('S3Driver', () => {
    let container: StartedTestContainer;
    let driver: S3Driver;

    beforeAll(async () => {
      container = await new GenericContainer('minio/minio:RELEASE.2025-04-22T22-12-26Z')
        .withExposedPorts(9000)
        .withEnvironment({ MINIO_ROOT_USER: 'immich', MINIO_ROOT_PASSWORD: 'immich-secret' })
        .withCommand(['server', '/data'])
        .withWaitStrategy(Wait.forLogMessage(/API:/))
        .start();

      const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;
      const input = {
        config: {
          kind: StorageTargetKind.S3 as const,
          endpoint,
          bucket: 'immich',
          region: 'us-east-1',
          forcePathStyle: true,
          prefix: 'photos',
        },
        secret: {
          kind: StorageTargetKind.S3 as const,
          accessKeyId: 'immich',
          secretAccessKey: 'immich-secret',
        },
      };

      // The bucket has to exist before the driver can be used; the driver
      // deliberately does not create it.
      const { CreateBucketCommand, S3Client } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: 'us-east-1',
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId: 'immich', secretAccessKey: 'immich-secret' },
      });
      await client.send(new CreateBucketCommand({ Bucket: 'immich' }));

      driver = new S3Driver(input);

      return async () => {
        await container.stop();
      };
    }, 180_000);

    itBehavesLikeADriver('s3', () => driver);
  });

  describe('WebDavDriver', () => {
    let container: StartedTestContainer;
    let driver: WebDavDriver;

    beforeAll(async () => {
      container = await new GenericContainer('nextcloud:31-apache')
        .withExposedPorts(80)
        .withEnvironment({
          SQLITE_DATABASE: 'nextcloud',
          NEXTCLOUD_ADMIN_USER: 'immich',
          NEXTCLOUD_ADMIN_PASSWORD: 'immich-secret',
          NEXTCLOUD_TRUSTED_DOMAINS: 'localhost',
        })
        // Nextcloud installs itself on first boot, so wait for the app rather
        // than just the port.
        .withWaitStrategy(Wait.forHttp('/status.php', 80).forStatusCode(200))
        .withStartupTimeout(300_000)
        .start();

      driver = new WebDavDriver({
        config: {
          kind: StorageTargetKind.WebDav,
          baseUrl: `http://${container.getHost()}:${container.getMappedPort(80)}/remote.php/dav/files/immich`,
          prefix: 'photos',
        },
        secret: { kind: StorageTargetKind.WebDav, username: 'immich', password: 'immich-secret' },
      });

      return async () => {
        await container.stop();
      };
    }, 360_000);

    itBehavesLikeADriver('webdav', () => driver);
  });
});
