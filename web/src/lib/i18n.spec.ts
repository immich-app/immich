import { langs } from '$lib/constants';
import messages from '$lib/i18n/en.json';
import { exec as execCallback } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { promisify } from 'node:util';

type Messages = { [key: string]: string | Messages };

const exec = promisify(execCallback);

function setEmptyMessages(messages: Messages) {
  const copy = { ...messages };

  for (const key in copy) {
    const message = copy[key];
    if (typeof message === 'string') {
      copy[key] = '';
    } else if (typeof message === 'object') {
      setEmptyMessages(message);
    }
  }

  return copy;
}

describe('i18n', () => {
  test('no missing messages', async () => {
    const { stdout } = await exec('npx svelte-i18n extract -c svelte.config.js "src/**/*"');
    const extractedMessages: Messages = JSON.parse(stdout);
    const existingMessages = setEmptyMessages(messages);

    // Only translations directly using the store seem to get extracted
    expect({ ...extractedMessages, ...existingMessages }).toEqual(existingMessages);
  });

  describe('loaders', () => {
    const languageFiles = readdirSync('src/lib/i18n').sort();
    for (const filename of languageFiles) {
      test(`${filename} should have a loader`, async () => {
        const code = filename.replaceAll('.json', '');
        const item = langs.find((lang) => lang.weblateCode === code || lang.code === code);
        expect(item, `${filename} has no loader`).toBeDefined();
        if (!item) {
          return;
        }

        // verify it loads the right file
        const module: { default?: unknown } = await item.loader();
        const translations = JSON.stringify(module.default, null, 2).trim();
        const content = readFileSync(`src/lib/i18n/${filename}`).toString().trim();
        expect(translations === content, `${item.name} did not load ${filename}`).toEqual(true);
      });
    }
  });
});
