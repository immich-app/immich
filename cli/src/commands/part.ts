import { defaults } from '@immich/sdk';
import { open, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { json, text } from 'node:stream/consumers';
import { BaseOptions, authenticate, sha1 } from 'src/utils';

export const partCmd = async (options: BaseOptions) => {
  await authenticate(options);

  const { baseUrl, headers } = defaults;

  const fname = 'blah.mp4';
  const stats = await stat(fname);
  const sh = await sha1(fname);
  const url = `${baseUrl}/asset-parts/${sh}`;

  const r = await fetch(url, {
    method: 'get',
    redirect: 'error',
    headers: headers as Record<string, string>,
  });

  const parts = (await json(r.body!)) as { part: number; size: number }[];

  const loadedParts = new Map<number, number>();

  for (const { part, size } of parts) {
    loadedParts.set(part, size);
  }

  console.log(loadedParts);

  const fd = await open(fname);
  const buff = Buffer.alloc(1 * 1024 * 1024); // TODO - make configurable?

  let offset = 0;
  let p = 0;

  for (; offset < stats.size; p++) {
    const rc = await fd.read(buff);
    const b = rc.bytesRead < buff.length ? buff.subarray(0, rc.bytesRead) : buff;
    const blob = new Blob([b]);
    offset += blob.size;
    console.log(b, blob);
    if (blob.size === loadedParts.get(p)) {
      console.log(`Skipping loaded part ${p}`);
      continue;
    }

    const formData = new FormData();
    formData.append('partData', blob);

    // TODO - upload multiple parts at once
    const response = await fetch(`${url}/${p}`, {
      method: 'put',
      redirect: 'error',
      headers: headers as Record<string, string>,
      body: formData,
    });

    console.log(`response:`, response.status, response.statusText);
  }

  const formData = new FormData();
  formData.append('deviceAssetId', `${basename(fname)}-${stats.size}`.replaceAll(/\s+/g, ''));
  formData.append('deviceId', 'CLI');
  formData.append('fileCreatedAt', stats.mtime.toISOString());
  formData.append('fileModifiedAt', stats.mtime.toISOString());
  formData.append('fileSize', String(stats.size));
  formData.append('isFavorite', 'false');
  formData.append('originalName', basename(fname));
  formData.append('parts', String(p));

  // TODO - add sidecar file to formData

  console.log(formData);

  const rr = await fetch(`${url}`, {
    method: 'post',
    redirect: 'error',
    headers: headers as Record<string, string>,
    body: formData,
  });

  console.log(rr);
  console.log(`rr:`, rr.status, rr.statusText);
  console.log(await text(rr.body!));
};
