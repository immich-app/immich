import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { QueueName } from '@immich/sdk';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const beforeNextRefresh = { timeout: 1000 };

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
});

test.beforeEach(async ({ router }) => {
  await router.goto(Route.viewQueue({ name: QueueName.FaceDetection }), { name: 'face-detection' });
});

test('shows the queue with its paused state and failed jobs', async ({ data, render, settle, app }) => {
  data.addQueues(
    factory.queue({ name: QueueName.FaceDetection, isPaused: true, statistics: { active: 2, waiting: 3, failed: 1 } }),
  );

  await render(Page, load);
  await settle();

  await expect.element(app.admin.queue.heading('admin.face_detection'), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queue.pausedBadge, beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queue.failedCount, beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queue.resumeButton, beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queue.pauseButton, beforeNextRefresh).not.toBeInTheDocument();
});

test('pausing a running queue shows the resume button', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.FaceDetection, isPaused: false }));
  await render(Page, load);
  await settle();

  await app.admin.queue.pauseButton.click();
  await settle();

  expect(api.updateQueue).toHaveBeenCalledWith({ params: { name: QueueName.FaceDetection }, body: { isPaused: true } });
  await expect.element(app.admin.queue.resumeButton, beforeNextRefresh).toBeVisible();
});

test('resuming a paused queue shows the pause button', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.FaceDetection, isPaused: true }));
  await render(Page, load);
  await settle();

  await app.admin.queue.resumeButton.click();
  await settle();

  expect(api.updateQueue).toHaveBeenCalledWith({
    params: { name: QueueName.FaceDetection },
    body: { isPaused: false },
  });
  await expect.element(app.admin.queue.pauseButton, beforeNextRefresh).toBeVisible();
});

test('clear empties the queue and keeps the failed jobs', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.FaceDetection, statistics: { waiting: 4, failed: 2 } }));
  await render(Page, load);
  await settle();

  await app.admin.queue.clearButton.click();
  await settle();

  expect(api.emptyQueue).toHaveBeenCalledWith({
    params: { name: QueueName.FaceDetection },
    body: { failed: false },
  });
  await expect.element(app.admin.queue.failedCount, beforeNextRefresh).toBeVisible();
});

test('remove failed jobs clears the failed count', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.FaceDetection, statistics: { failed: 2 } }));
  await render(Page, load);
  await settle();
  await expect.element(app.admin.queue.failedCount, beforeNextRefresh).toBeVisible();

  await app.admin.queue.removeFailedJobsButton.click();
  await settle();

  expect(api.emptyQueue).toHaveBeenCalledWith({
    params: { name: QueueName.FaceDetection },
    body: { failed: true },
  });
  await expect.element(app.admin.queue.failedCount, beforeNextRefresh).not.toBeInTheDocument();
});

test('refreshes the queue every three seconds', async ({ data, render, settle, app }) => {
  data.addQueues(factory.queue({ name: QueueName.FaceDetection }));
  await render(Page, load);
  await settle();
  await expect.element(app.admin.queue.pausedBadge, beforeNextRefresh).not.toBeInTheDocument();

  data.addQueues(factory.queue({ name: QueueName.FaceDetection, isPaused: true }));
  vi.advanceTimersByTime(2999);
  await settle();
  await expect.element(app.admin.queue.pausedBadge, beforeNextRefresh).not.toBeInTheDocument();

  vi.advanceTimersByTime(1);
  await settle();
  await expect.element(app.admin.queue.pausedBadge, beforeNextRefresh).toBeVisible();
});
