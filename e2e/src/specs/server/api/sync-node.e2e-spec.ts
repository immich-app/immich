import { LoginResponseDto, Permission } from '@immich/sdk';
import { readFileSync } from 'node:fs';
import { testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const nodeA = 'http://127.0.0.1:2285/api';
const nodeB = 'http://127.0.0.1:2287/api';

// Node B lives in docker-compose.node-b.yml so that every other e2e spec is not
// made to pay for a second full stack. When it is not up, this spec stands down
// rather than failing the suite.
const isNodeBUp = async () => {
  try {
    const { status } = await request(nodeB).get('/server/ping');
    return status === 200;
  } catch {
    return false;
  }
};

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Poll until a predicate holds, so the test follows the queue rather than guessing at sleeps. */
const eventually = async <T>(fn: () => Promise<T>, predicate: (value: T) => boolean, ms = 60_000): Promise<T> => {
  const deadline = Date.now() + ms;
  let last: T;
  do {
    last = await fn();
    if (predicate(last)) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (Date.now() < deadline);

  throw new Error(`Condition not met within ${ms}ms. Last value: ${JSON.stringify(last!)?.slice(0, 300)}`);
};

const assetsOf = async (base: string, token: string, filename: string) => {
  const { body } = await request(base)
    .post('/search/metadata')
    .set(bearer(token))
    .send({ originalFileName: filename, withDeleted: true });
  return body.assets.items as { id: string; isTrashed: boolean; ownerId: string }[];
};

describe('/admin/sync-nodes', () => {
  let available = false;
  let adminA: LoginResponseDto;
  let adminB: LoginResponseDto;
  let userA: LoginResponseDto;
  let userB: LoginResponseDto;
  let peerKey: string;
  let pairingKey: string;
  let nodeId: string;

  beforeAll(async () => {
    available = await isNodeBUp();
    if (!available) {
      return;
    }

    await utils.resetDatabase();
    adminA = await utils.adminSetup();
    userA = await utils.userSetup(adminA.accessToken, {
      email: 'sync-a@immich.cloud',
      password: 'password',
      name: 'Sync A',
    });

    // Node B is a separate instance, so it is set up over HTTP rather than
    // through the helpers, which are bound to node A.
    await request(nodeB).post('/auth/admin-sign-up').send({
      email: 'admin@immich.cloud',
      password: 'password',
      name: 'Immich Admin',
    });
    const { body: loginB } = await request(nodeB)
      .post('/auth/login')
      .send({ email: 'admin@immich.cloud', password: 'password' });
    adminB = loginB;

    await request(nodeB).post('/admin/users').set(bearer(adminB.accessToken)).send({
      email: 'sync-b@immich.cloud',
      password: 'password',
      name: 'Sync B',
    });
    const { body: userLoginB } = await request(nodeB)
      .post('/auth/login')
      .send({ email: 'sync-b@immich.cloud', password: 'password' });
    userB = userLoginB;

    // Two different keys on purpose. The node-level key does admin work such as
    // listing users; the pairing key belongs to the paired user, because asset
    // endpoints act as whoever owns the key.
    const { body: adminKey } = await request(nodeB)
      .post('/api-keys')
      .set(bearer(adminB.accessToken))
      .send({ name: 'sync-admin', permissions: [Permission.All] });
    peerKey = adminKey.secret;

    const { body: userKey } = await request(nodeB)
      .post('/api-keys')
      .set(bearer(userB.accessToken))
      .send({ name: 'sync-user', permissions: [Permission.All] });
    pairingKey = userKey.secret;
  }, 180_000);

  it('should add the other server as a sync node', async () => {
    if (!available) {
      return;
    }

    const { status, body } = await request(nodeA)
      .post('/admin/sync-nodes')
      .set(bearer(adminA.accessToken))
      .send({ name: 'Node B', url: 'http://immich-e2e-server-b:2285', apiKey: peerKey, isEnabled: true });

    expect(status).toBe(201);
    expect(body.status).toBe('online');
    expect(body).not.toHaveProperty('apiKey');
    nodeId = body.id;
  }, 60_000);

  it('should reject a node whose api key is not valid', async () => {
    if (!available) {
      return;
    }

    const { status } = await request(nodeA)
      .post('/admin/sync-nodes')
      .set(bearer(adminA.accessToken))
      .send({ name: 'Bad key', url: 'http://immich-e2e-server-b:2285', apiKey: 'nonsense', isEnabled: true });

    expect(status).toBe(400);
  }, 60_000);

  it('should list users on the other server and pair two of them', async () => {
    if (!available) {
      return;
    }

    const { body: remoteUsers } = await request(nodeA)
      .get(`/admin/sync-nodes/${nodeId}/users`)
      .set(bearer(adminA.accessToken));

    const remote = remoteUsers.find((user: { email: string }) => user.email === 'sync-b@immich.cloud');
    expect(remote).toBeDefined();

    const { status, body } = await request(nodeA)
      .post(`/admin/sync-nodes/${nodeId}/pairings`)
      .set(bearer(adminA.accessToken))
      .send({
        localUserId: userA.userId,
        remoteUserId: remote.id,
        remoteApiKey: pairingKey,
        pushEnabled: true,
        pullEnabled: true,
      });

    expect(status).toBe(201);
    expect(body.remoteUserEmail).toBe('sync-b@immich.cloud');
  }, 60_000);

  it('should refuse a pairing key that acts as somebody else', async () => {
    if (!available) {
      return;
    }

    // The admin key is valid and reaches the node, but acts as the admin. Left
    // unchecked it would file every pushed asset under the wrong account.
    const { status, body } = await request(nodeA)
      .post(`/admin/sync-nodes/${nodeId}/pairings`)
      .set(bearer(adminA.accessToken))
      .send({
        localUserId: adminA.userId,
        remoteUserId: userB.userId,
        remoteApiKey: peerKey,
        pushEnabled: true,
        pullEnabled: true,
      });

    expect(status).toBe(400);
    expect(body.message).toContain('API key');
  }, 60_000);

  it('should push a new local asset to the other server', async () => {
    if (!available) {
      return;
    }

    await utils.createAsset(userA.accessToken, {
      assetData: {
        filename: 'pushed.jpg',
        bytes: readFileSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`),
      },
    });

    const [pairing] = await pairings(nodeId, adminA.accessToken);
    await request(nodeA).post(`/admin/sync-nodes/pairings/${pairing.id}/sync`).set(bearer(adminA.accessToken));

    const arrived = await eventually(
      () => assetsOf(nodeB, userB.accessToken, 'pushed.jpg'),
      (items) => items.length > 0,
    );

    expect(arrived[0].ownerId).toBe(userB.userId);
  }, 180_000);

  it('should pull an asset created on the other server', async () => {
    if (!available) {
      return;
    }

    const form = new FormData();
    form.append('deviceAssetId', 'pulled-1');
    form.append('deviceId', 'e2e');
    form.append('fileCreatedAt', new Date().toISOString());
    form.append('fileModifiedAt', new Date().toISOString());
    form.append(
      'assetData',
      new Blob([readFileSync(`${testAssetDir}/albums/nature/el_torcal_rocks.jpg`)]),
      'pulled.jpg',
    );

    const uploaded = await fetch(`${nodeB}/assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.accessToken}` },
      body: form,
    });
    expect(uploaded.ok).toBe(true);

    const [pairing] = await pairings(nodeId, adminA.accessToken);
    await request(nodeA).post(`/admin/sync-nodes/pairings/${pairing.id}/sync`).set(bearer(adminA.accessToken));

    const arrived = await eventually(
      () => assetsOf(nodeA, userA.accessToken, 'pulled.jpg'),
      (items) => items.length > 0,
    );

    expect(arrived[0].ownerId).toBe(userA.userId);
  }, 180_000);

  it('should not send an asset back to where it came from', async () => {
    if (!available) {
      return;
    }

    const [pairing] = await pairings(nodeId, adminA.accessToken);
    await request(nodeA).post(`/admin/sync-nodes/pairings/${pairing.id}/sync`).set(bearer(adminA.accessToken));
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // One copy on each side, not two: the identity map means an asset that
    // arrived by pull is not pushed straight back, and vice versa.
    const onA = await assetsOf(nodeA, userA.accessToken, 'pulled.jpg');
    const onB = await assetsOf(nodeB, userB.accessToken, 'pushed.jpg');

    expect(onA).toHaveLength(1);
    expect(onB).toHaveLength(1);
  }, 180_000);

  it('should transfer a batch and drain the work ledger', async () => {
    if (!available) {
      return;
    }

    const names = ['batch-1.jpg', 'batch-2.jpg', 'batch-3.jpg'];
    const sources = ['cyclamen_persicum', 'polemonium_reptans', 'silver_fir'];

    for (const [index, name] of names.entries()) {
      await utils.createAsset(userA.accessToken, {
        assetData: {
          filename: name,
          bytes: readFileSync(`${testAssetDir}/albums/nature/${sources[index]}.jpg`),
        },
      });
    }

    const [pairing] = await pairings(nodeId, adminA.accessToken);
    await request(nodeA).post(`/admin/sync-nodes/pairings/${pairing.id}/sync`).set(bearer(adminA.accessToken));

    // All three arrive, rather than one at a time across successive runs.
    await eventually(
      async () => {
        const counts = await Promise.all(names.map((name) => assetsOf(nodeB, userB.accessToken, name)));
        return counts.filter((items) => items.length > 0).length;
      },
      (arrived) => arrived === names.length,
    );

    // Nothing left outstanding once they have landed: every queued item is
    // removed from the ledger as it succeeds, so a non-zero count here would
    // mean work had been silently dropped or left stuck.
    // Draining trails the arrivals: the pull side re-scans and the retry pass runs
    // at the end of the pair job, so allow well past the transfer itself.
    const drained = await eventually(
      async () => {
        const [current] = await pairings(nodeId, adminA.accessToken);
        return current;
      },
      (current) => current.pendingCount === 0,
      150_000,
    );

    expect(drained.stuckCount).toBe(0);
  }, 240_000);

  it("should propagate a local deletion to the other server's trash", async () => {
    if (!available) {
      return;
    }

    const [local] = await assetsOf(nodeA, userA.accessToken, 'pushed.jpg');
    await request(nodeA)
      .delete('/assets')
      .set(bearer(userA.accessToken))
      .send({ ids: [local.id], force: false });

    const [pairing] = await pairings(nodeId, adminA.accessToken);
    await request(nodeA).post(`/admin/sync-nodes/pairings/${pairing.id}/sync`).set(bearer(adminA.accessToken));

    const trashed = await eventually(
      () => assetsOf(nodeB, userB.accessToken, 'pushed.jpg'),
      (items) => items.length > 0 && items[0].isTrashed,
    );

    // Trashed, not gone: a propagated deletion stays recoverable.
    expect(trashed[0].isTrashed).toBe(true);
  }, 180_000);
});

const pairings = async (nodeId: string, token: string) => {
  const { body } = await request(nodeA).get(`/admin/sync-nodes/${nodeId}/pairings`).set(bearer(token));
  return body as { id: string; pendingCount: number; stuckCount: number }[];
};
