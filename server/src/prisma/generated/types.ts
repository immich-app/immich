import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Activity = {
    id: Generated<string>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    albumId: string;
    userId: string;
    assetId: string | null;
    comment: string | null;
    isLiked: Generated<boolean>;
};
export type Albums = {
    id: Generated<string>;
    ownerId: string;
    albumName: Generated<string>;
    createdAt: Generated<Timestamp>;
    albumThumbnailAssetId: string | null;
    updatedAt: Generated<Timestamp>;
    description: Generated<string>;
    deletedAt: Timestamp | null;
    isActivityEnabled: Generated<boolean>;
    order: Generated<string>;
};
export type AlbumsAssetsAssets = {
    albumsId: string;
    assetsId: string;
};
export type AlbumsSharedUsersUsers = {
    albumsId: string;
    usersId: string;
};
export type ApiKeys = {
    name: string;
    key: string;
    userId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    id: Generated<string>;
};
export type AssetFaces = {
    assetId: string;
    personId: string | null;
    imageWidth: Generated<number>;
    imageHeight: Generated<number>;
    boundingBoxX1: Generated<number>;
    boundingBoxY1: Generated<number>;
    boundingBoxX2: Generated<number>;
    boundingBoxY2: Generated<number>;
    id: Generated<string>;
};
export type AssetJobStatus = {
    assetId: string;
    facesRecognizedAt: Timestamp | null;
    metadataExtractedAt: Timestamp | null;
    duplicatesDetectedAt: Timestamp | null;
};
export type Assets = {
    id: Generated<string>;
    deviceAssetId: string;
    ownerId: string;
    deviceId: string;
    type: string;
    originalPath: string;
    previewPath: string | null;
    fileCreatedAt: Timestamp;
    fileModifiedAt: Timestamp;
    isFavorite: Generated<boolean>;
    duration: string | null;
    thumbnailPath: Generated<string | null>;
    encodedVideoPath: Generated<string | null>;
    checksum: Buffer;
    isVisible: Generated<boolean>;
    livePhotoVideoId: string | null;
    updatedAt: Generated<Timestamp>;
    createdAt: Generated<Timestamp>;
    isArchived: Generated<boolean>;
    originalFileName: string;
    sidecarPath: string | null;
    isReadOnly: Generated<boolean>;
    thumbhash: Buffer | null;
    isOffline: Generated<boolean>;
    libraryId: string | null;
    isExternal: Generated<boolean>;
    deletedAt: Timestamp | null;
    localDateTime: Timestamp;
    stackId: string | null;
    duplicateId: string | null;
    truncatedDate: Generated<Timestamp>;
};
export type AssetStack = {
    id: Generated<string>;
    primaryAssetId: string;
};
export type Audit = {
    id: Generated<number>;
    entityType: string;
    entityId: string;
    action: string;
    ownerId: string;
    createdAt: Generated<Timestamp>;
};
export type Exif = {
    assetId: string;
    make: string | null;
    model: string | null;
    exifImageWidth: number | null;
    exifImageHeight: number | null;
    fileSizeInByte: string | null;
    orientation: string | null;
    dateTimeOriginal: Timestamp | null;
    modifyDate: Timestamp | null;
    lensModel: string | null;
    fNumber: number | null;
    focalLength: number | null;
    iso: number | null;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state: string | null;
    country: string | null;
    description: Generated<string>;
    fps: number | null;
    exposureTime: string | null;
    livePhotoCID: string | null;
    timeZone: string | null;
    projectionType: string | null;
    profileDescription: string | null;
    colorspace: string | null;
    bitsPerSample: number | null;
    autoStackId: string | null;
};
export type GeodataPlaces = {
    id: number;
    name: string;
    longitude: number;
    latitude: number;
    countryCode: string;
    admin1Code: string | null;
    admin2Code: string | null;
    modificationDate: Timestamp;
    admin1Name: string | null;
    admin2Name: string | null;
    alternateNames: string | null;
};
export type Libraries = {
    id: Generated<string>;
    name: string;
    ownerId: string;
    type: string;
    importPaths: string[];
    exclusionPatterns: string[];
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    deletedAt: Timestamp | null;
    refreshedAt: Timestamp | null;
    isVisible: Generated<boolean>;
};
export type MoveHistory = {
    id: Generated<string>;
    entityId: string;
    pathType: string;
    oldPath: string;
    newPath: string;
};
export type Partners = {
    sharedById: string;
    sharedWithId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    inTimeline: Generated<boolean>;
};
export type Person = {
    id: Generated<string>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    ownerId: string;
    name: Generated<string>;
    thumbnailPath: Generated<string>;
    isHidden: Generated<boolean>;
    birthDate: Timestamp | null;
    faceAssetId: string | null;
};
export type SharedLinkAsset = {
    assetsId: string;
    sharedLinksId: string;
};
export type SharedLinks = {
    id: Generated<string>;
    description: string | null;
    userId: string;
    key: Buffer;
    type: string;
    createdAt: Generated<Timestamp>;
    expiresAt: Timestamp | null;
    allowUpload: Generated<boolean>;
    albumId: string | null;
    allowDownload: Generated<boolean>;
    showExif: Generated<boolean>;
    password: string | null;
};
export type SmartInfo = {
    assetId: string;
    tags: string[];
    objects: string[];
};
export type SmartSearch = {
    assetId: string;
};
export type SocketIoAttachments = {
    id: Generated<string>;
    created_at: Generated<Timestamp | null>;
    payload: Buffer | null;
};
export type SystemConfig = {
    key: string;
    value: string | null;
};
export type SystemMetadata = {
    key: string;
    value: Generated<unknown>;
};
export type TagAsset = {
    assetsId: string;
    tagsId: string;
};
export type Tags = {
    id: Generated<string>;
    type: string;
    name: string;
    userId: string;
    renameTagId: string | null;
};
export type Users = {
    id: Generated<string>;
    email: string;
    password: Generated<string>;
    createdAt: Generated<Timestamp>;
    profileImagePath: Generated<string>;
    isAdmin: Generated<boolean>;
    shouldChangePassword: Generated<boolean>;
    deletedAt: Timestamp | null;
    oauthId: Generated<string>;
    updatedAt: Generated<Timestamp>;
    storageLabel: string | null;
    memoriesEnabled: Generated<boolean>;
    name: Generated<string>;
    avatarColor: string | null;
    quotaSizeInBytes: string | null;
    quotaUsageInBytes: Generated<string>;
    status: Generated<string>;
};
export type UserToken = {
    id: Generated<string>;
    token: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    userId: string;
    deviceType: Generated<string>;
    deviceOS: Generated<string>;
};
export type DB = {
    activity: Activity;
    albums: Albums;
    albums_assets_assets: AlbumsAssetsAssets;
    albums_shared_users_users: AlbumsSharedUsersUsers;
    api_keys: ApiKeys;
    asset_faces: AssetFaces;
    asset_job_status: AssetJobStatus;
    asset_stack: AssetStack;
    assets: Assets;
    audit: Audit;
    exif: Exif;
    geodata_places: GeodataPlaces;
    libraries: Libraries;
    move_history: MoveHistory;
    partners: Partners;
    person: Person;
    shared_link__asset: SharedLinkAsset;
    shared_links: SharedLinks;
    smart_info: SmartInfo;
    smart_search: SmartSearch;
    socket_io_attachments: SocketIoAttachments;
    system_config: SystemConfig;
    system_metadata: SystemMetadata;
    tag_asset: TagAsset;
    tags: Tags;
    user_token: UserToken;
    users: Users;
};
