import { webcrypto } from 'node:crypto';
const { subtle } = webcrypto;

export async function etag(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const buffer = await subtle.digest('SHA-1', data);
    const hash = Buffer.from(buffer).toString('base64').slice(0, 27);
    return `"${data.length}-${hash}"`;
}