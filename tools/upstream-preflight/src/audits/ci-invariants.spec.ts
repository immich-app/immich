import { describe, expect, it } from 'vitest';
import { checkCiInvariantText } from './ci-invariants';

describe('checkCiInvariantText', () => {
  it('flags forbidden patterns outside exceptions', () => {
    const result = checkCiInvariantText(
      {
        id: 'no-push-o-matic',
        title: 'No PUSH_O_MATIC',
        forbidden_patterns: ['PUSH_O_MATIC', 'create-workflow-token'],
        paths: ['.github/workflows/**/*.yml', '.github/workflows/**/*.yaml'],
        exceptions: ['.github/workflows/merge-translations.yml'],
      },
      [
        {
          path: '.github/workflows/test.yaml',
          text: 'uses: create-workflow-token\nsecret: PUSH_O_MATIC_APP_ID',
        },
        {
          path: '.github/workflows/merge-translations.yml',
          text: 'PUSH_O_MATIC_APP_ID',
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      '.github/workflows/test.yaml contains forbidden pattern PUSH_O_MATIC',
      '.github/workflows/test.yaml contains forbidden pattern create-workflow-token',
    ]);
  });

  it('allows exception globs', () => {
    const result = checkCiInvariantText(
      {
        id: 'translation-token-exception',
        title: 'Translation token exception',
        forbidden_patterns: ['PUSH_O_MATIC'],
        paths: ['.github/workflows/**/*.yml'],
        exceptions: ['.github/workflows/merge-*.yml'],
      },
      [
        {
          path: '.github/workflows/merge-translations.yml',
          text: 'PUSH_O_MATIC_APP_ID',
        },
      ],
    );

    expect(result.ok).toBe(true);
  });
});
