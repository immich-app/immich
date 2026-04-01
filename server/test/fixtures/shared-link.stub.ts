import { MapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkResponseDto } from 'src/dtos/shared-link.dto';
import { SharedLinkType } from 'src/enum';
import { AssetFactory } from 'test/factories/asset.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';

const today = new Date();
const tomorrow = new Date();
const yesterday = new Date();
tomorrow.setDate(today.getDate() + 1);
yesterday.setDate(yesterday.getDate() - 1);

const sharedLinkBytes = Buffer.from(
  '2c2b646895f84753bff43fb696ad124f3b0faf2a0bd547406f26fa4a76b5c71990092baa536275654b2ab7a191fb21a6d6cd',
  'hex',
);

export const sharedLinkStub = {
  individual: Object.freeze({
    id: '123',
    userId: authStub.admin.user.id,
    key: sharedLinkBytes,
    type: SharedLinkType.Individual,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    albumId: null,
    album: null,
    description: null,
    assets: [AssetFactory.create()],
    password: 'password',
    slug: null,
  }),
  valid: Object.freeze({
    id: '123',
    userId: authStub.admin.user.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.Album,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    albumId: null,
    description: null,
    password: null,
    assets: [] as MapAsset[],
    album: null,
    slug: null,
  }),
  expired: Object.freeze({
    id: '123',
    userId: authStub.admin.user.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.Album,
    createdAt: today,
    expiresAt: yesterday,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    description: null,
    password: null,
    albumId: null,
    assets: [] as MapAsset[],
    album: null,
    slug: null,
  }),
  readonlyNoExif: Object.freeze({
    id: '123',
    userId: authStub.admin.user.id,
    key: sharedLinkBytes,
    type: SharedLinkType.Individual,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: false,
    allowDownload: false,
    showExif: false,
    description: null,
    password: null,
    assets: [],
    albumId: null,
    album: null,
    slug: null,
  }),
  passwordRequired: Object.freeze({
    id: '123',
    userId: authStub.admin.user.id,
    key: sharedLinkBytes,
    type: SharedLinkType.Album,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    slug: null,
    description: null,
    password: 'password',
    assets: [],
    albumId: null,
    album: null,
  }),
};

export const sharedLinkResponseStub = {
  valid: Object.freeze<SharedLinkResponseDto>({
    allowDownload: true,
    allowUpload: true,
    assets: [],
    createdAt: today,
    description: null,
    password: null,
    expiresAt: tomorrow,
    id: '123',
    key: sharedLinkBytes.toString('base64url'),
    showMetadata: true,
    type: SharedLinkType.Album,
    userId: 'admin_id',
    slug: null,
  }),
  expired: Object.freeze<SharedLinkResponseDto>({
    album: undefined,
    allowDownload: true,
    allowUpload: true,
    assets: [],
    createdAt: today,
    description: null,
    password: null,
    expiresAt: yesterday,
    id: '123',
    key: sharedLinkBytes.toString('base64url'),
    showMetadata: true,
    type: SharedLinkType.Album,
    userId: 'admin_id',
    slug: null,
  }),
};
