import { Selectable } from 'kysely';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetEditTable } from 'src/schema/tables/asset-edit.table';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { UserMetadataTable } from 'src/schema/tables/user-metadata.table';
import { UserTable } from 'src/schema/tables/user.table';

type GetField<T extends string, F extends string> = T extends `${F}.${infer R}` ? R : never;
type GetRoot<T extends string> = T extends `${infer L}.${string}` ? L : T;

type RelationKeysPathInternal<T = RelationKeys, L = never> = {
  [K in keyof T & string]: T[K] extends object
    ? `${K}.${RelationKeysPathInternal<T[K], L | K>}`
    : Exclude<T[K], L> extends never
      ? never
      : T[K] extends keyof RelationKeys
        ? K | `${K}.${RelationKeysPathInternal<RelationKeys[T[K]], L | T[K]>}`
        : K;
}[keyof T & string];

export type RelationKeysPath<
  T extends keyof RelationKeys | '' = '',
  P extends keyof RelationKeys = never,
> = T extends keyof RelationKeys
  ? RelationKeysPathInternal<
      RelationKeys[T],
      P extends never ? never : P | { [K in keyof RelationKeys[P]]: RelationKeys[P][K] }[keyof RelationKeys[P]]
    >
  : RelationKeysPathInternal | keyof RelationKeys;

export type FactoryBuilder<T, R extends T = T> = (builder: T) => R;

export type AssetLike = Partial<Selectable<AssetTable>>;
export type AssetExifLike = Partial<Selectable<AssetExifTable>>;
export type AssetEditLike = Partial<Selectable<AssetEditTable>>;
export type AssetFileLike = Partial<Selectable<AssetFileTable>>;
export type AlbumLike = Partial<Selectable<AlbumTable>>;
export type AlbumUserLike = Partial<Selectable<AlbumUserTable>>;
export type SharedLinkLike = Partial<Selectable<SharedLinkTable>>;
export type UserLike = Partial<Selectable<UserTable>>;

type RelationKeys = {
  album: { owner: 'user'; assets: 'asset'; albumUsers: 'albumUser'; sharedLinks: 'sharedLink' };
  asset: { exifInfo: 'exifInfo'; owner: 'user'; edits: 'assetEdit'; files: 'assetFile'; faces: 'assetFace' };
  albumUser: { user: 'user' };
  sharedLink: { owner: 'user'; album: 'album'; assets: 'asset' };
  auth: { sharedLink: 'sharedLink' };
  user: { metadata: 'metadata' };
};

// TODO technically we have all the relevant information already in `RelationKeys`
// Consider removing these
type AlbumRelations<T extends RelationKeysPath<'album'>> = Pick<
  {
    owner: UserStub<GetField<T, 'owner'>>;
    assets: AssetStub<GetField<T, 'assets'>>[];
    albumUsers: AlbumUserStub<GetField<T, 'albumUsers'>>[];
    sharedLinks: SharedLinkStub<GetField<T, 'sharedLinks'>>[];
  },
  GetRoot<T>
>;

type AssetRelations<T extends RelationKeysPath<'asset'>> = Pick<
  {
    exifInfo: ExifStub;
    owner: UserStub<GetField<T, 'owner'>>;
    edits: AssetEditStub[];
    files: AssetFileStub[];
    faces: AssetFaceStub[];
  },
  GetRoot<T>
>;

type AlbumUserRelations<T extends RelationKeysPath<'albumUser'>> = Pick<
  {
    user: UserStub<GetField<T, 'user'>>;
  },
  GetRoot<T>
>;

type UserRelations<T extends RelationKeysPath<'user'>> = Pick<
  {
    metadata: UserMetadataStub[];
  },
  GetRoot<T>
>;

type SharedLinkRelations<T extends RelationKeysPath<'sharedLink'>> = Pick<
  {
    owner: UserStub<GetField<T, 'owner'>>;
    album: AlbumStub<GetField<T, 'album'>>;
    assets: AssetStub<GetField<T, 'assets'>>[];
  },
  GetRoot<T>
>;

type AuthRelations<T extends RelationKeysPath<'auth'>> = Pick<
  { sharedLink: SharedLinkStub<GetField<T, 'sharedLink'>> },
  GetRoot<T>
>;

export type AlbumStub<T extends RelationKeysPath<'album'>> = Selectable<AlbumTable> & AlbumRelations<T>;
export type UserStub<T extends RelationKeysPath<'user'>> = Selectable<UserTable> & UserRelations<T>;
export type UserMetadataStub = Selectable<UserMetadataTable>;
export type AssetStub<T extends RelationKeysPath<'asset'>> = Selectable<AssetTable> & AssetRelations<T>;
export type AlbumUserStub<T extends RelationKeysPath<'albumUser'>> = Selectable<AlbumUserTable> & AlbumUserRelations<T>;
export type SharedLinkStub<T extends RelationKeysPath<'sharedLink'>> = Selectable<SharedLinkTable> &
  SharedLinkRelations<T>;
export type ExifStub = Selectable<AssetExifTable>;
export type AssetEditStub = AssetEditActionItem;
export type AssetFileStub = Selectable<AssetFileTable>;
export type AuthStub<T extends RelationKeysPath<'auth'>> = {
  user: Pick<UserStub<never>, 'id' | 'isAdmin' | 'name' | 'email' | 'quotaUsageInBytes' | 'quotaSizeInBytes'>;
} & AuthRelations<T>;
export type AssetFaceStub = Selectable<AssetFaceTable>;
