import messages from '$lib/i18n/en.json';
import { exec as execCallback } from 'node:child_process';
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
});
