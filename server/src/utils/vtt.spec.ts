import { TranscriptionStatus } from 'src/enum';
import { toWebVtt } from 'src/utils/vtt';
import { describe, expect, it } from 'vitest';

const progress = { status: TranscriptionStatus.Complete, progressMs: 10_000 };

describe('toWebVtt', () => {
  it('should render the model text for an uncorrected segment', () => {
    const vtt = toWebVtt([{ startTime: 0, endTime: 1.5, text: 'Hello Jon', correctedText: null }], progress);

    expect(vtt).toContain('Hello Jon');
  });

  it('should prefer the correction over the model text', () => {
    const vtt = toWebVtt([{ startTime: 0, endTime: 1.5, text: 'Hello Jon', correctedText: 'Hello John' }], progress);

    expect(vtt).toContain('Hello John');
    expect(vtt).not.toContain('Hello Jon\n');
  });
});
