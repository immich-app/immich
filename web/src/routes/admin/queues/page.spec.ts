import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { QueueName } from '@immich/sdk';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const thumbnails = 'Admin.thumbnail_generation_job';
const metadata = 'Admin.metadata_extraction_job';

const beforeNextRefresh = { timeout: 1000 };

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
});

test('lists the queues with their counts and paused state', async ({ data, render, settle, app }) => {
  data.addQueues([
    factory.queue({ name: QueueName.ThumbnailGeneration, statistics: { active: 3, waiting: 4, delayed: 1 } }),
    factory.queue({ name: QueueName.MetadataExtraction, isPaused: true, statistics: { waiting: 7 } }),
  ]);

  await render(Page, load);
  await settle();

  await expect.element(app.admin.queues.count(thumbnails, 3), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queues.count(thumbnails, 5), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queues.pausedBadge(thumbnails), beforeNextRefresh).not.toBeInTheDocument();
  await expect.element(app.admin.queues.pauseButton(thumbnails), beforeNextRefresh).toBeVisible();

  await expect.element(app.admin.queues.count(metadata, 7), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queues.pausedBadge(metadata), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queues.resumeButton(metadata), beforeNextRefresh).toBeVisible();
});

test('pausing a queue from its card shows it paused', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.ThumbnailGeneration, statistics: { active: 1, waiting: 2 } }));
  await render(Page, load);
  await settle();

  await app.admin.queues.pauseButton(thumbnails).click();
  await settle();

  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.ThumbnailGeneration },
    body: { command: 'pause', force: false },
  });
  await expect.element(app.admin.queues.pausedBadge(thumbnails), beforeNextRefresh).toBeVisible();
  await expect.element(app.admin.queues.resumeButton(thumbnails), beforeNextRefresh).toBeVisible();
});

test('resuming a queue from its card shows it running', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.ThumbnailGeneration, isPaused: true, statistics: { waiting: 2 } }));
  await render(Page, load);
  await settle();

  await app.admin.queues.resumeButton(thumbnails).click();
  await settle();

  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.ThumbnailGeneration },
    body: { command: 'resume', force: false },
  });
  await expect.element(app.admin.queues.pausedBadge(thumbnails), beforeNextRefresh).not.toBeInTheDocument();
  await expect.element(app.admin.queues.pauseButton(thumbnails), beforeNextRefresh).toBeVisible();
});

test('clearing a queue from its card empties its waiting jobs', async ({ data, render, settle, api, app }) => {
  data.addQueues(factory.queue({ name: QueueName.ThumbnailGeneration, statistics: { active: 1, waiting: 6 } }));
  await render(Page, load);
  await settle();

  await app.admin.queues.clearButton(thumbnails).click();
  await settle();

  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.ThumbnailGeneration },
    body: { command: 'empty', force: false },
  });
  await expect.element(app.admin.queues.count(thumbnails, 6), beforeNextRefresh).not.toBeInTheDocument();
  await expect.element(app.admin.queues.clearButton(thumbnails), beforeNextRefresh).not.toBeInTheDocument();
});

test('resetting all faces asks for confirmation first', async ({ data, render, settle, api, app }) => {
  data.userConfig.machineLearning.enabled = true;
  data.addQueues(factory.queue({ name: QueueName.FaceDetection }));
  await render(Page, load);
  await settle();

  await app.admin.queues.resetButton('Admin.face_detection').click();
  await expect.element(app.admin.queues.reprocessAllFacesMessage).toBeVisible();
  await app.cancelButton.click();
  await settle();

  expect(api.runQueueCommandLegacy).not.toHaveBeenCalled();

  await app.admin.queues.resetButton('Admin.face_detection').click();
  await app.confirmButton.click();
  await settle();

  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.FaceDetection },
    body: { command: 'start', force: true },
  });
});

test('resume paused jobs resumes every paused queue', async ({ data, render, settle, api, app }) => {
  data.addQueues([
    factory.queue({ name: QueueName.ThumbnailGeneration, isPaused: true, statistics: { waiting: 1 } }),
    factory.queue({ name: QueueName.MetadataExtraction, isPaused: true, statistics: { waiting: 1 } }),
    factory.queue({ name: QueueName.VideoConversion, statistics: { waiting: 1 } }),
  ]);
  await render(Page, load);
  await settle();

  await app.admin.queues.resumePausedButton.click();
  await settle();

  expect(api.runQueueCommandLegacy.calls).toHaveLength(2);
  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.ThumbnailGeneration },
    body: { command: 'resume', force: false },
  });
  expect(api.runQueueCommandLegacy).toHaveBeenCalledWith({
    params: { name: QueueName.MetadataExtraction },
    body: { command: 'resume', force: false },
  });
  await expect.element(app.admin.queues.anyPausedBadge, beforeNextRefresh).not.toBeInTheDocument();
  await expect.element(app.admin.queues.resumePausedButton, beforeNextRefresh).not.toBeInTheDocument();
});

test('refreshes the queues every three seconds', async ({ data, render, settle, app }) => {
  data.addQueues(factory.queue({ name: QueueName.ThumbnailGeneration, statistics: { active: 1, waiting: 2 } }));
  await render(Page, load);
  await settle();
  await expect.element(app.admin.queues.count(thumbnails, 2), beforeNextRefresh).toBeVisible();

  data.addQueues(factory.queue({ name: QueueName.ThumbnailGeneration, statistics: { active: 1, waiting: 9 } }));
  vi.advanceTimersByTime(2999);
  await settle();
  await expect.element(app.admin.queues.count(thumbnails, 2), beforeNextRefresh).toBeVisible();

  vi.advanceTimersByTime(1);
  await settle();
  await expect.element(app.admin.queues.count(thumbnails, 9), beforeNextRefresh).toBeVisible();
});
