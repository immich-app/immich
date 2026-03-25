import { BrowserContext } from '@playwright/test';
import { randomThumbnail } from 'src/ui/generators/timeline';

// Minimal valid H.264 MP4 (8x8px, 1 frame) that browsers can decode to get videoWidth/videoHeight
const MINIMAL_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c' +
  '3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMg' +
  'LSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwg' +
  'LSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMg' +
  'bWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5n' +
  'ZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEg' +
  'ZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJl' +
  'YWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJh' +
  'eV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2Fk' +
  'YXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtl' +
  'eWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9v' +
  'a2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBt' +
  'YXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTX' +
  'zg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAA' +
  'AAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAA' +
  'Ahl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAA' +
  'AAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAA' +
  'AAEAAAAqAAAAAAABAAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAA' +
  'LWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAA' +
  'AAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0' +
  'c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAAB' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs' +
  '2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3Rz' +
  'YwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAA' +
  'MAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWls' +
  'c3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';

export const MINIMAL_MP4_BUFFER = Buffer.from(MINIMAL_MP4_BASE64, 'base64');

export type MockPerson = {
  id: string;
  name: string;
  birthDate: string | null;
  isHidden: boolean;
  thumbnailPath: string;
  updatedAt: string;
};

export const createMockPeople = (count: number): MockPerson[] => {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Eve Adams',
    'Frank Castle',
    'Grace Lee',
    'Hank Pym',
    'Iris West',
    'Jack Ryan',
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: `person-${index}`,
    name: names[index % names.length],
    birthDate: null,
    isHidden: false,
    thumbnailPath: `/upload/thumbs/person-${index}.jpeg`,
    updatedAt: '2025-01-01T00:00:00.000Z',
  }));
};

export type FaceCreateCapture = {
  requests: Array<{
    assetId: string;
    personId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
  }>;
};

export const setupFaceEditorMockApiRoutes = async (
  context: BrowserContext,
  mockPeople: MockPerson[],
  faceCreateCapture: FaceCreateCapture,
) => {
  await context.route('**/api/people?*', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        hasNextPage: false,
        hidden: 0,
        people: mockPeople,
        total: mockPeople.length,
      },
    });
  });

  await context.route('**/api/faces', async (route, request) => {
    if (request.method() !== 'POST') {
      return route.fallback();
    }

    const body = request.postDataJSON();
    faceCreateCapture.requests.push(body);

    return route.fulfill({
      status: 201,
      contentType: 'text/plain',
      body: 'OK',
    });
  });

  await context.route('**/api/people/*/thumbnail', async (route) => {
    if (!route.request().serviceWorker()) {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
      body: await randomThumbnail('person-thumb', 1),
    });
  });
};
