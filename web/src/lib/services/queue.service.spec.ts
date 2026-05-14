import { formatSampledJobTypeCount, getQueueJobTypeLabel } from '$lib/services/queue.service';
import { JobName } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

describe('queue service', () => {
  it('labels shared-space face matching jobs separately from facial recognition', () => {
    expect(getQueueJobTypeLabel(JobName.SharedSpaceFaceMatchPage)).toBe('Shared space face matching');
    expect(getQueueJobTypeLabel(JobName.SharedSpacePersonDedup)).toBe('Shared space people dedup');
    expect(getQueueJobTypeLabel(JobName.FacialRecognition)).toBe('Facial recognition');
  });

  it('formats sampled job type counts as capped values above the sampling limit', () => {
    const formatNumber = (count: number) => count.toLocaleString('de-DE');

    expect(formatSampledJobTypeCount(999, formatNumber)).toBe('999');
    expect(formatSampledJobTypeCount(1000, formatNumber)).toBe('1.000');
    expect(formatSampledJobTypeCount(1001, formatNumber)).toBe('1.000+');
  });
});
