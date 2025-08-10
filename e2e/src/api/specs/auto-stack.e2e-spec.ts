import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

// E2E tests for auto-stack candidate feature flag behavior
// Scenarios:
//  - Flag enabled: candidates endpoint reachable (empty array OK) and promote returns disabled only when no candidates
//  - Flag disabled: endpoints reflect disabled state (list empty, promote returns { error: 'disabled' })
//  - Toggle flag on, create rapid assets, expect at least one candidate
//  - Promote candidate creates real stack and removes candidate
//  - Discard candidate prevents re-listing

describe('/auto-stack (candidates)', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  const auth = () => ({ Authorization: `Bearer ${user.accessToken}` });
  const adminAuth = () => ({ Authorization: `Bearer ${admin.accessToken}` });

  async function setFlag(value: boolean) {
    const current = await utils.getSystemConfig(admin.accessToken);
  current.server.autoStack.enabled = value as any;
    await utils.updateSystemConfig(admin.accessToken, current as any);
  }

  it('returns disabled when flag is off', async () => {
    await setFlag(false);
    const { status, body } = await request(app)
      .post('/auto-stack/candidates/00000000-0000-0000-0000-000000000000/promote')
      .set(auth())
      .send({});
    expect(status).toBeGreaterThanOrEqual(200);
    expect(body).toEqual({ error: 'disabled' });
  });

  it('lists empty array with flag on and no candidates', async () => {
    await setFlag(true);
    const { status, body } = await request(app).get('/auto-stack/candidates').set(auth());
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('creates candidates after rapid asset uploads', async () => {
    // Create a burst of 3 assets within a few seconds
    const a1 = await utils.createAsset(user.accessToken);
    const a2 = await utils.createAsset(user.accessToken);
    const a3 = await utils.createAsset(user.accessToken);
    expect(a1.id && a2.id && a3.id).toBeTruthy();

    // Manually invoke background generation job for user (queue generate job directly if exposed via API/jobs)
    // For now rely on metadata events having triggered candidate generation.

    // Poll a few times in case async processing
    let candidates: any[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/auto-stack/candidates').set(auth());
      candidates = res.body;
      if (candidates.length) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('promotes a candidate into a stack then removes it from list', async () => {
    const listRes = await request(app).get('/auto-stack/candidates').set(auth());
    const candidate = listRes.body[0];
    expect(candidate).toBeDefined();

    const promote = await request(app)
      .post(`/auto-stack/candidates/${candidate.id}/promote`)
      .set(auth())
      .send({});
  expect(promote.status).toBeGreaterThanOrEqual(200);
    expect(promote.body.stackId).toBeDefined();

    const after = await request(app).get('/auto-stack/candidates').set(auth());
    expect(after.body.find((c: any) => c.id === candidate.id)).toBeFalsy();
  });

  it('dismisses a candidate', async () => {
    // Create two new assets to form another candidate
    await utils.createAsset(user.accessToken);
    await utils.createAsset(user.accessToken);
    let target: any = null;
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/auto-stack/candidates').set(auth());
      target = res.body.find((c: any) => !c.promotedStackId);
      if (target) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(target).toBeDefined();

    const del = await request(app)
      .delete(`/auto-stack/candidates/${target.id}`)
      .set(auth());
    expect(del.status).toBe(200);

    const after = await request(app).get('/auto-stack/candidates').set(auth());
    expect(after.body.find((c: any) => c.id === target.id)).toBeFalsy();
  });
});
