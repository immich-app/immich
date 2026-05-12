import { getQueueJobTypeLabel } from '$lib/services/queue.service';
import { JobName } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

describe('queue service', () => {
  it('labels shared-space face matching jobs separately from facial recognition', () => {
    expect(getQueueJobTypeLabel(JobName.SharedSpaceFaceMatchPage)).toBe('Shared space face matching');
    expect(getQueueJobTypeLabel(JobName.SharedSpacePersonDedup)).toBe('Shared space people dedup');
    expect(getQueueJobTypeLabel(JobName.FacialRecognition)).toBe('Facial recognition');
  });
});
