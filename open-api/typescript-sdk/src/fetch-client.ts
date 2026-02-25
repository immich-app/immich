/**
 * Immich
 * 2.5.6
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "/api"
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "/api"
};
export type UserResponseDto = {
    /** Avatar color */
    avatarColor: UserAvatarColor;
    /** User email */
    email: string;
    /** User ID */
    id: string;
    /** User name */
    name: string;
    /** Profile change date */
    profileChangedAt: string;
    /** Profile image path */
    profileImagePath: string;
};
export type ActivityResponseDto = {
    /** Asset ID (if activity is for an asset) */
    assetId: string | null;
    /** Comment text (for comment activities) */
    comment?: string | null;
    /** Creation date */
    createdAt: string;
    /** Activity ID */
    id: string;
    /** Activity type */
    "type": ReactionType;
    user: UserResponseDto;
};
export type ActivityCreateDto = {
    /** Album ID */
    albumId: string;
    /** Asset ID (if activity is for an asset) */
    assetId?: string;
    /** Comment text (required if type is comment) */
    comment?: string;
    /** Activity type (like or comment) */
    "type": ReactionType;
};
export type ActivityStatisticsResponseDto = {
    /** Number of comments */
    comments: number;
    /** Number of likes */
    likes: number;
};
export type DatabaseBackupDeleteDto = {
    backups: string[];
};
export type DatabaseBackupDto = {
    filename: string;
    filesize: number;
};
export type DatabaseBackupListResponseDto = {
    backups: DatabaseBackupDto[];
};
export type DatabaseBackupUploadDto = {
    file?: Blob;
};
export type SetMaintenanceModeDto = {
    /** Maintenance action */
    action: MaintenanceAction;
    /** Restore backup filename */
    restoreBackupFilename?: string;
};
export type MaintenanceDetectInstallStorageFolderDto = {
    /** Number of files in the folder */
    files: number;
    /** Storage folder */
    folder: StorageFolder;
    /** Whether the folder is readable */
    readable: boolean;
    /** Whether the folder is writable */
    writable: boolean;
};
export type MaintenanceDetectInstallResponseDto = {
    storage: MaintenanceDetectInstallStorageFolderDto[];
};
export type MaintenanceLoginDto = {
    /** Maintenance token */
    token?: string;
};
export type MaintenanceAuthDto = {
    /** Maintenance username */
    username: string;
};
export type MaintenanceStatusResponseDto = {
    /** Maintenance action */
    action: MaintenanceAction;
    active: boolean;
    error?: string;
    progress?: number;
    task?: string;
};
export type NotificationCreateDto = {
    /** Additional notification data */
    data?: object;
    /** Notification description */
    description?: string | null;
    /** Notification level */
    level?: NotificationLevel;
    /** Date when notification was read */
    readAt?: string | null;
    /** Notification title */
    title: string;
    /** Notification type */
    "type"?: NotificationType;
    /** User ID to send notification to */
    userId: string;
};
export type NotificationDto = {
    /** Creation date */
    createdAt: string;
    /** Additional notification data */
    data?: object;
    /** Notification description */
    description?: string;
    /** Notification ID */
    id: string;
    /** Notification level */
    level: NotificationLevel;
    /** Date when notification was read */
    readAt?: string;
    /** Notification title */
    title: string;
    /** Notification type */
    "type": NotificationType;
};
export type TemplateDto = {
    /** Template name */
    template: string;
};
export type TemplateResponseDto = {
    /** Template HTML content */
    html: string;
    /** Template name */
    name: string;
};
export type SystemConfigSmtpTransportDto = {
    /** SMTP server hostname */
    host: string;
    /** Whether to ignore SSL certificate errors */
    ignoreCert: boolean;
    /** SMTP password */
    password: string;
    /** SMTP server port */
    port: number;
    /** Whether to use secure connection (TLS/SSL) */
    secure: boolean;
    /** SMTP username */
    username: string;
};
export type SystemConfigSmtpDto = {
    /** Whether SMTP email notifications are enabled */
    enabled: boolean;
    /** Email address to send from */
    "from": string;
    /** Email address for replies */
    replyTo: string;
    transport: SystemConfigSmtpTransportDto;
};
export type TestEmailResponseDto = {
    /** Email message ID */
    messageId: string;
};
export type UserLicense = {
    /** Activation date */
    activatedAt: string;
    /** Activation key */
    activationKey: string;
    /** License key */
    licenseKey: string;
};
export type UserAdminResponseDto = {
    /** Avatar color */
    avatarColor: UserAvatarColor;
    /** Creation date */
    createdAt: string;
    /** Deletion date */
    deletedAt: string | null;
    /** User email */
    email: string;
    /** User ID */
    id: string;
    /** Is admin user */
    isAdmin: boolean;
    /** User license */
    license: (UserLicense) | null;
    /** User name */
    name: string;
    /** OAuth ID */
    oauthId: string;
    /** Profile change date */
    profileChangedAt: string;
    /** Profile image path */
    profileImagePath: string;
    /** Storage quota in bytes */
    quotaSizeInBytes: number | null;
    /** Storage usage in bytes */
    quotaUsageInBytes: number | null;
    /** Require password change on next login */
    shouldChangePassword: boolean;
    /** User status */
    status: UserStatus;
    /** Storage label */
    storageLabel: string | null;
    /** Last update date */
    updatedAt: string;
};
export type UserAdminCreateDto = {
    /** Avatar color */
    avatarColor?: (UserAvatarColor) | null;
    /** User email */
    email: string;
    /** Grant admin privileges */
    isAdmin?: boolean;
    /** User name */
    name: string;
    /** Send notification email */
    notify?: boolean;
    /** User password */
    password: string;
    /** PIN code */
    pinCode?: string | null;
    /** Storage quota in bytes */
    quotaSizeInBytes?: number | null;
    /** Require password change on next login */
    shouldChangePassword?: boolean;
    /** Storage label */
    storageLabel?: string | null;
};
export type UserAdminDeleteDto = {
    /** Force delete even if user has assets */
    force?: boolean;
};
export type UserAdminUpdateDto = {
    /** Avatar color */
    avatarColor?: (UserAvatarColor) | null;
    /** User email */
    email?: string;
    /** Grant admin privileges */
    isAdmin?: boolean;
    /** User name */
    name?: string;
    /** User password */
    password?: string;
    /** PIN code */
    pinCode?: string | null;
    /** Storage quota in bytes */
    quotaSizeInBytes?: number | null;
    /** Require password change on next login */
    shouldChangePassword?: boolean;
    /** Storage label */
    storageLabel?: string | null;
};
export type AlbumsResponse = {
    /** Default asset order for albums */
    defaultAssetOrder: AssetOrder;
};
export type CastResponse = {
    /** Whether Google Cast is enabled */
    gCastEnabled: boolean;
};
export type DownloadResponse = {
    /** Maximum archive size in bytes */
    archiveSize: number;
    /** Whether to include embedded videos in downloads */
    includeEmbeddedVideos: boolean;
};
export type EmailNotificationsResponse = {
    /** Whether to receive email notifications for album invites */
    albumInvite: boolean;
    /** Whether to receive email notifications for album updates */
    albumUpdate: boolean;
    /** Whether email notifications are enabled */
    enabled: boolean;
};
export type FoldersResponse = {
    /** Whether folders are enabled */
    enabled: boolean;
    /** Whether folders appear in web sidebar */
    sidebarWeb: boolean;
};
export type MemoriesResponse = {
    /** Memory duration in seconds */
    duration: number;
    /** Whether memories are enabled */
    enabled: boolean;
};
export type PeopleResponse = {
    /** Whether people are enabled */
    enabled: boolean;
    /** Whether people appear in web sidebar */
    sidebarWeb: boolean;
};
export type PurchaseResponse = {
    /** Date until which to hide buy button */
    hideBuyButtonUntil: string;
    /** Whether to show support badge */
    showSupportBadge: boolean;
};
export type RatingsResponse = {
    /** Whether ratings are enabled */
    enabled: boolean;
};
export type SharedLinksResponse = {
    /** Whether shared links are enabled */
    enabled: boolean;
    /** Whether shared links appear in web sidebar */
    sidebarWeb: boolean;
};
export type TagsResponse = {
    /** Whether tags are enabled */
    enabled: boolean;
    /** Whether tags appear in web sidebar */
    sidebarWeb: boolean;
};
export type UserPreferencesResponseDto = {
    albums: AlbumsResponse;
    cast: CastResponse;
    download: DownloadResponse;
    emailNotifications: EmailNotificationsResponse;
    folders: FoldersResponse;
    memories: MemoriesResponse;
    people: PeopleResponse;
    purchase: PurchaseResponse;
    ratings: RatingsResponse;
    sharedLinks: SharedLinksResponse;
    tags: TagsResponse;
};
export type AlbumsUpdate = {
    /** Default asset order for albums */
    defaultAssetOrder?: AssetOrder;
};
export type AvatarUpdate = {
    /** Avatar color */
    color?: UserAvatarColor;
};
export type CastUpdate = {
    /** Whether Google Cast is enabled */
    gCastEnabled?: boolean;
};
export type DownloadUpdate = {
    /** Maximum archive size in bytes */
    archiveSize?: number;
    /** Whether to include embedded videos in downloads */
    includeEmbeddedVideos?: boolean;
};
export type EmailNotificationsUpdate = {
    /** Whether to receive email notifications for album invites */
    albumInvite?: boolean;
    /** Whether to receive email notifications for album updates */
    albumUpdate?: boolean;
    /** Whether email notifications are enabled */
    enabled?: boolean;
};
export type FoldersUpdate = {
    /** Whether folders are enabled */
    enabled?: boolean;
    /** Whether folders appear in web sidebar */
    sidebarWeb?: boolean;
};
export type MemoriesUpdate = {
    /** Memory duration in seconds */
    duration?: number;
    /** Whether memories are enabled */
    enabled?: boolean;
};
export type PeopleUpdate = {
    /** Whether people are enabled */
    enabled?: boolean;
    /** Whether people appear in web sidebar */
    sidebarWeb?: boolean;
};
export type PurchaseUpdate = {
    /** Date until which to hide buy button */
    hideBuyButtonUntil?: string;
    /** Whether to show support badge */
    showSupportBadge?: boolean;
};
export type RatingsUpdate = {
    /** Whether ratings are enabled */
    enabled?: boolean;
};
export type SharedLinksUpdate = {
    /** Whether shared links are enabled */
    enabled?: boolean;
    /** Whether shared links appear in web sidebar */
    sidebarWeb?: boolean;
};
export type TagsUpdate = {
    /** Whether tags are enabled */
    enabled?: boolean;
    /** Whether tags appear in web sidebar */
    sidebarWeb?: boolean;
};
export type UserPreferencesUpdateDto = {
    albums?: AlbumsUpdate;
    avatar?: AvatarUpdate;
    cast?: CastUpdate;
    download?: DownloadUpdate;
    emailNotifications?: EmailNotificationsUpdate;
    folders?: FoldersUpdate;
    memories?: MemoriesUpdate;
    people?: PeopleUpdate;
    purchase?: PurchaseUpdate;
    ratings?: RatingsUpdate;
    sharedLinks?: SharedLinksUpdate;
    tags?: TagsUpdate;
};
export type SessionResponseDto = {
    /** App version */
    appVersion: string | null;
    /** Creation date */
    createdAt: string;
    /** Is current session */
    current: boolean;
    /** Device OS */
    deviceOS: string;
    /** Device type */
    deviceType: string;
    /** Expiration date */
    expiresAt?: string;
    /** Session ID */
    id: string;
    /** Is pending sync reset */
    isPendingSyncReset: boolean;
    /** Last update date */
    updatedAt: string;
};
export type AssetStatsResponseDto = {
    /** Number of images */
    images: number;
    /** Total number of assets */
    total: number;
    /** Number of videos */
    videos: number;
};
export type AlbumUserResponseDto = {
    /** Album user role */
    role: AlbumUserRole;
    user: UserResponseDto;
};
export type ExifResponseDto = {
    /** City name */
    city?: string | null;
    /** Country name */
    country?: string | null;
    /** Original date/time */
    dateTimeOriginal?: string | null;
    /** Image description */
    description?: string | null;
    /** Image height in pixels */
    exifImageHeight?: number | null;
    /** Image width in pixels */
    exifImageWidth?: number | null;
    /** Exposure time */
    exposureTime?: string | null;
    /** F-number (aperture) */
    fNumber?: number | null;
    /** File size in bytes */
    fileSizeInByte?: number | null;
    /** Focal length in mm */
    focalLength?: number | null;
    /** ISO sensitivity */
    iso?: number | null;
    /** GPS latitude */
    latitude?: number | null;
    /** Lens model */
    lensModel?: string | null;
    /** GPS longitude */
    longitude?: number | null;
    /** Camera make */
    make?: string | null;
    /** Camera model */
    model?: string | null;
    /** Modification date/time */
    modifyDate?: string | null;
    /** Image orientation */
    orientation?: string | null;
    /** Projection type */
    projectionType?: string | null;
    /** Rating */
    rating?: number | null;
    /** State/province name */
    state?: string | null;
    /** Time zone */
    timeZone?: string | null;
};
export type AssetFaceWithoutPersonResponseDto = {
    /** Bounding box X1 coordinate */
    boundingBoxX1: number;
    /** Bounding box X2 coordinate */
    boundingBoxX2: number;
    /** Bounding box Y1 coordinate */
    boundingBoxY1: number;
    /** Bounding box Y2 coordinate */
    boundingBoxY2: number;
    /** Face ID */
    id: string;
    /** Image height in pixels */
    imageHeight: number;
    /** Image width in pixels */
    imageWidth: number;
    /** Face detection source type */
    sourceType?: SourceType;
};
export type PersonWithFacesResponseDto = {
    /** Person date of birth */
    birthDate: string | null;
    /** Person color (hex) */
    color?: string;
    /** Face detections */
    faces: AssetFaceWithoutPersonResponseDto[];
    /** Person ID */
    id: string;
    /** Is favorite */
    isFavorite?: boolean;
    /** Is hidden */
    isHidden: boolean;
    /** Person name */
    name: string;
    /** Thumbnail path */
    thumbnailPath: string;
    /** Last update date */
    updatedAt?: string;
};
export type AssetStackResponseDto = {
    /** Number of assets in stack */
    assetCount: number;
    /** Stack ID */
    id: string;
    /** Primary asset ID */
    primaryAssetId: string;
};
export type TagResponseDto = {
    /** Tag color (hex) */
    color?: string;
    /** Creation date */
    createdAt: string;
    /** Tag ID */
    id: string;
    /** Tag name */
    name: string;
    /** Parent tag ID */
    parentId?: string;
    /** Last update date */
    updatedAt: string;
    /** Tag value (full path) */
    value: string;
};
export type AssetResponseDto = {
    /** Base64 encoded SHA1 hash */
    checksum: string;
    /** The UTC timestamp when the asset was originally uploaded to Immich. */
    createdAt: string;
    /** Device asset ID */
    deviceAssetId: string;
    /** Device ID */
    deviceId: string;
    /** Duplicate group ID */
    duplicateId?: string | null;
    /** Video duration (for videos) */
    duration: string;
    exifInfo?: ExifResponseDto;
    /** The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken. */
    fileCreatedAt: string;
    /** The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken. */
    fileModifiedAt: string;
    /** Whether asset has metadata */
    hasMetadata: boolean;
    /** Asset height */
    height: number | null;
    /** Asset ID */
    id: string;
    /** Is archived */
    isArchived: boolean;
    /** Is edited */
    isEdited: boolean;
    /** Is favorite */
    isFavorite: boolean;
    /** Is offline */
    isOffline: boolean;
    /** Is trashed */
    isTrashed: boolean;
    /** Library ID */
    libraryId?: string | null;
    /** Live photo video ID */
    livePhotoVideoId?: string | null;
    /** The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by "local" days and months. */
    localDateTime: string;
    /** Original file name */
    originalFileName: string;
    /** Original MIME type */
    originalMimeType?: string;
    /** Original file path */
    originalPath: string;
    owner?: UserResponseDto;
    /** Owner user ID */
    ownerId: string;
    people?: PersonWithFacesResponseDto[];
    /** Is resized */
    resized?: boolean;
    stack?: (AssetStackResponseDto) | null;
    tags?: TagResponseDto[];
    /** Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting. */
    thumbhash: string | null;
    /** Asset type */
    "type": AssetTypeEnum;
    unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
    /** The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified. */
    updatedAt: string;
    /** Asset visibility */
    visibility: AssetVisibility;
    /** Asset width */
    width: number | null;
};
export type ContributorCountResponseDto = {
    /** Number of assets contributed */
    assetCount: number;
    /** User ID */
    userId: string;
};
export type AlbumResponseDto = {
    /** Album name */
    albumName: string;
    /** Thumbnail asset ID */
    albumThumbnailAssetId: string | null;
    albumUsers: AlbumUserResponseDto[];
    /** Number of assets */
    assetCount: number;
    assets: AssetResponseDto[];
    contributorCounts?: ContributorCountResponseDto[];
    /** Creation date */
    createdAt: string;
    /** Album description */
    description: string;
    /** End date (latest asset) */
    endDate?: string;
    /** Has shared link */
    hasSharedLink: boolean;
    /** Album ID */
    id: string;
    /** Activity feed enabled */
    isActivityEnabled: boolean;
    /** Last modified asset timestamp */
    lastModifiedAssetTimestamp?: string;
    /** Asset sort order */
    order?: AssetOrder;
    owner: UserResponseDto;
    /** Owner user ID */
    ownerId: string;
    /** Is shared album */
    shared: boolean;
    /** Start date (earliest asset) */
    startDate?: string;
    /** Last update date */
    updatedAt: string;
};
export type AlbumUserCreateDto = {
    /** Album user role */
    role: AlbumUserRole;
    /** User ID */
    userId: string;
};
export type CreateAlbumDto = {
    /** Album name */
    albumName: string;
    /** Album users */
    albumUsers?: AlbumUserCreateDto[];
    /** Initial asset IDs */
    assetIds?: string[];
    /** Album description */
    description?: string;
};
export type AlbumsAddAssetsDto = {
    /** Album IDs */
    albumIds: string[];
    /** Asset IDs */
    assetIds: string[];
};
export type AlbumsAddAssetsResponseDto = {
    /** Error reason */
    error?: BulkIdErrorReason;
    /** Operation success */
    success: boolean;
};
export type AlbumStatisticsResponseDto = {
    /** Number of non-shared albums */
    notShared: number;
    /** Number of owned albums */
    owned: number;
    /** Number of shared albums */
    shared: number;
};
export type UpdateAlbumDto = {
    /** Album name */
    albumName?: string;
    /** Album thumbnail asset ID */
    albumThumbnailAssetId?: string;
    /** Album description */
    description?: string;
    /** Enable activity feed */
    isActivityEnabled?: boolean;
    /** Asset sort order */
    order?: AssetOrder;
};
export type BulkIdsDto = {
    /** IDs to process */
    ids: string[];
};
export type BulkIdResponseDto = {
    /** Error reason if failed */
    error?: Error;
    /** ID */
    id: string;
    /** Whether operation succeeded */
    success: boolean;
};
export type UpdateAlbumUserDto = {
    /** Album user role */
    role: AlbumUserRole;
};
export type AlbumUserAddDto = {
    /** Album user role */
    role?: AlbumUserRole;
    /** User ID */
    userId: string;
};
export type AddUsersDto = {
    /** Album users to add */
    albumUsers: AlbumUserAddDto[];
};
export type ApiKeyResponseDto = {
    /** Creation date */
    createdAt: string;
    /** API key ID */
    id: string;
    /** API key name */
    name: string;
    /** List of permissions */
    permissions: Permission[];
    /** Last update date */
    updatedAt: string;
};
export type ApiKeyCreateDto = {
    /** API key name */
    name?: string;
    /** List of permissions */
    permissions: Permission[];
};
export type ApiKeyCreateResponseDto = {
    apiKey: ApiKeyResponseDto;
    /** API key secret (only shown once) */
    secret: string;
};
export type ApiKeyUpdateDto = {
    /** API key name */
    name?: string;
    /** List of permissions */
    permissions?: Permission[];
};
export type AssetBulkDeleteDto = {
    /** Force delete even if in use */
    force?: boolean;
    /** IDs to process */
    ids: string[];
};
export type AssetMetadataUpsertItemDto = {
    /** Metadata key */
    key: string;
    /** Metadata value (object) */
    value: object;
};
export type AssetMediaCreateDto = {
    /** Asset file data */
    assetData: Blob;
    /** Device asset ID */
    deviceAssetId: string;
    /** Device ID */
    deviceId: string;
    /** Duration (for videos) */
    duration?: string;
    /** File creation date */
    fileCreatedAt: string;
    /** File modification date */
    fileModifiedAt: string;
    /** Filename */
    filename?: string;
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Live photo video ID */
    livePhotoVideoId?: string;
    /** Asset metadata items */
    metadata?: AssetMetadataUpsertItemDto[];
    /** Sidecar file data */
    sidecarData?: Blob;
    /** Asset visibility */
    visibility?: AssetVisibility;
};
export type AssetMediaResponseDto = {
    /** Asset media ID */
    id: string;
    /** Upload status */
    status: AssetMediaStatus;
};
export type AssetBulkUpdateDto = {
    /** Original date and time */
    dateTimeOriginal?: string;
    /** Relative time offset in seconds */
    dateTimeRelative?: number;
    /** Asset description */
    description?: string;
    /** Duplicate ID */
    duplicateId?: string | null;
    /** Asset IDs to update */
    ids: string[];
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Latitude coordinate */
    latitude?: number;
    /** Longitude coordinate */
    longitude?: number;
    /** Rating */
    rating?: number;
    /** Time zone (IANA timezone) */
    timeZone?: string;
    /** Asset visibility */
    visibility?: AssetVisibility;
};
export type AssetBulkUploadCheckItem = {
    /** Base64 or hex encoded SHA1 hash */
    checksum: string;
    /** Asset ID */
    id: string;
};
export type AssetBulkUploadCheckDto = {
    /** Assets to check */
    assets: AssetBulkUploadCheckItem[];
};
export type AssetBulkUploadCheckResult = {
    /** Upload action */
    action: Action;
    /** Existing asset ID if duplicate */
    assetId?: string;
    /** Asset ID */
    id: string;
    /** Whether existing asset is trashed */
    isTrashed?: boolean;
    /** Rejection reason if rejected */
    reason?: Reason;
};
export type AssetBulkUploadCheckResponseDto = {
    /** Upload check results */
    results: AssetBulkUploadCheckResult[];
};
export type AssetCopyDto = {
    /** Copy album associations */
    albums?: boolean;
    /** Copy favorite status */
    favorite?: boolean;
    /** Copy shared links */
    sharedLinks?: boolean;
    /** Copy sidecar file */
    sidecar?: boolean;
    /** Source asset ID */
    sourceId: string;
    /** Copy stack association */
    stack?: boolean;
    /** Target asset ID */
    targetId: string;
};
export type CheckExistingAssetsDto = {
    /** Device asset IDs to check */
    deviceAssetIds: string[];
    /** Device ID */
    deviceId: string;
};
export type CheckExistingAssetsResponseDto = {
    /** Existing asset IDs */
    existingIds: string[];
};
export type AssetJobsDto = {
    /** Asset IDs */
    assetIds: string[];
    /** Job name */
    name: AssetJobName;
};
export type AssetMetadataBulkDeleteItemDto = {
    /** Asset ID */
    assetId: string;
    /** Metadata key */
    key: string;
};
export type AssetMetadataBulkDeleteDto = {
    /** Metadata items to delete */
    items: AssetMetadataBulkDeleteItemDto[];
};
export type AssetMetadataBulkUpsertItemDto = {
    /** Asset ID */
    assetId: string;
    /** Metadata key */
    key: string;
    /** Metadata value (object) */
    value: object;
};
export type AssetMetadataBulkUpsertDto = {
    /** Metadata items to upsert */
    items: AssetMetadataBulkUpsertItemDto[];
};
export type AssetMetadataBulkResponseDto = {
    /** Asset ID */
    assetId: string;
    /** Metadata key */
    key: string;
    /** Last update date */
    updatedAt: string;
    /** Metadata value (object) */
    value: object;
};
export type UpdateAssetDto = {
    /** Original date and time */
    dateTimeOriginal?: string;
    /** Asset description */
    description?: string;
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Latitude coordinate */
    latitude?: number;
    /** Live photo video ID */
    livePhotoVideoId?: string | null;
    /** Longitude coordinate */
    longitude?: number;
    /** Rating */
    rating?: number;
    /** Asset visibility */
    visibility?: AssetVisibility;
};
export type CropParameters = {
    /** Height of the crop */
    height: number;
    /** Width of the crop */
    width: number;
    /** Top-Left X coordinate of crop */
    x: number;
    /** Top-Left Y coordinate of crop */
    y: number;
};
export type RotateParameters = {
    /** Rotation angle in degrees */
    angle: number;
};
export type MirrorParameters = {
    /** Axis to mirror along */
    axis: MirrorAxis;
};
export type AssetEditActionItemResponseDto = {
    /** Type of edit action to perform */
    action: AssetEditAction;
    id: string;
    /** List of edit actions to apply (crop, rotate, or mirror) */
    parameters: CropParameters | RotateParameters | MirrorParameters;
};
export type AssetEditsResponseDto = {
    /** Asset ID these edits belong to */
    assetId: string;
    /** List of edit actions applied to the asset */
    edits: AssetEditActionItemResponseDto[];
};
export type AssetEditActionItemDto = {
    /** Type of edit action to perform */
    action: AssetEditAction;
    /** List of edit actions to apply (crop, rotate, or mirror) */
    parameters: CropParameters | RotateParameters | MirrorParameters;
};
export type AssetEditsCreateDto = {
    /** List of edit actions to apply (crop, rotate, or mirror) */
    edits: AssetEditActionItemDto[];
};
export type AssetMetadataResponseDto = {
    /** Metadata key */
    key: string;
    /** Last update date */
    updatedAt: string;
    /** Metadata value (object) */
    value: object;
};
export type AssetMetadataUpsertDto = {
    /** Metadata items to upsert */
    items: AssetMetadataUpsertItemDto[];
};
export type AssetOcrResponseDto = {
    assetId: string;
    /** Confidence score for text detection box */
    boxScore: number;
    id: string;
    /** Recognized text */
    text: string;
    /** Confidence score for text recognition */
    textScore: number;
    /** Normalized x coordinate of box corner 1 (0-1) */
    x1: number;
    /** Normalized x coordinate of box corner 2 (0-1) */
    x2: number;
    /** Normalized x coordinate of box corner 3 (0-1) */
    x3: number;
    /** Normalized x coordinate of box corner 4 (0-1) */
    x4: number;
    /** Normalized y coordinate of box corner 1 (0-1) */
    y1: number;
    /** Normalized y coordinate of box corner 2 (0-1) */
    y2: number;
    /** Normalized y coordinate of box corner 3 (0-1) */
    y3: number;
    /** Normalized y coordinate of box corner 4 (0-1) */
    y4: number;
};
export type AssetMediaReplaceDto = {
    /** Asset file data */
    assetData: Blob;
    /** Device asset ID */
    deviceAssetId: string;
    /** Device ID */
    deviceId: string;
    /** Duration (for videos) */
    duration?: string;
    /** File creation date */
    fileCreatedAt: string;
    /** File modification date */
    fileModifiedAt: string;
    /** Filename */
    filename?: string;
};
export type SignUpDto = {
    /** User email */
    email: string;
    /** User name */
    name: string;
    /** User password */
    password: string;
};
export type ChangePasswordDto = {
    /** Invalidate all other sessions */
    invalidateSessions?: boolean;
    /** New password (min 8 characters) */
    newPassword: string;
    /** Current password */
    password: string;
};
export type LoginCredentialDto = {
    /** User email */
    email: string;
    /** User password */
    password: string;
};
export type LoginResponseDto = {
    /** Access token */
    accessToken: string;
    /** Is admin user */
    isAdmin: boolean;
    /** Is onboarded */
    isOnboarded: boolean;
    /** User name */
    name: string;
    /** Profile image path */
    profileImagePath: string;
    /** Should change password */
    shouldChangePassword: boolean;
    /** User email */
    userEmail: string;
    /** User ID */
    userId: string;
};
export type LogoutResponseDto = {
    /** Redirect URI */
    redirectUri: string;
    /** Logout successful */
    successful: boolean;
};
export type PinCodeResetDto = {
    /** User password (required if PIN code is not provided) */
    password?: string;
    /** New PIN code (4-6 digits) */
    pinCode?: string;
};
export type PinCodeSetupDto = {
    /** PIN code (4-6 digits) */
    pinCode: string;
};
export type PinCodeChangeDto = {
    /** New PIN code (4-6 digits) */
    newPinCode: string;
    /** User password (required if PIN code is not provided) */
    password?: string;
    /** New PIN code (4-6 digits) */
    pinCode?: string;
};
export type SessionUnlockDto = {
    /** User password (required if PIN code is not provided) */
    password?: string;
    /** New PIN code (4-6 digits) */
    pinCode?: string;
};
export type AuthStatusResponseDto = {
    /** Session expiration date */
    expiresAt?: string;
    /** Is elevated session */
    isElevated: boolean;
    /** Has password set */
    password: boolean;
    /** Has PIN code set */
    pinCode: boolean;
    /** PIN expiration date */
    pinExpiresAt?: string;
};
export type ValidateAccessTokenResponseDto = {
    /** Authentication status */
    authStatus: boolean;
};
export type DownloadArchiveDto = {
    /** Asset IDs */
    assetIds: string[];
    /** Download edited asset if available */
    edited?: boolean;
};
export type DownloadInfoDto = {
    /** Album ID to download */
    albumId?: string;
    /** Archive size limit in bytes */
    archiveSize?: number;
    /** Asset IDs to download */
    assetIds?: string[];
    /** User ID to download assets from */
    userId?: string;
};
export type DownloadArchiveInfo = {
    /** Asset IDs in this archive */
    assetIds: string[];
    /** Archive size in bytes */
    size: number;
};
export type DownloadResponseDto = {
    /** Archive information */
    archives: DownloadArchiveInfo[];
    /** Total size in bytes */
    totalSize: number;
};
export type DuplicateResponseDto = {
    /** Duplicate assets */
    assets: AssetResponseDto[];
    /** Duplicate group ID */
    duplicateId: string;
};
export type PersonResponseDto = {
    /** Person date of birth */
    birthDate: string | null;
    /** Person color (hex) */
    color?: string;
    /** Person ID */
    id: string;
    /** Is favorite */
    isFavorite?: boolean;
    /** Is hidden */
    isHidden: boolean;
    /** Person name */
    name: string;
    /** Thumbnail path */
    thumbnailPath: string;
    /** Last update date */
    updatedAt?: string;
};
export type AssetFaceResponseDto = {
    /** Bounding box X1 coordinate */
    boundingBoxX1: number;
    /** Bounding box X2 coordinate */
    boundingBoxX2: number;
    /** Bounding box Y1 coordinate */
    boundingBoxY1: number;
    /** Bounding box Y2 coordinate */
    boundingBoxY2: number;
    /** Face ID */
    id: string;
    /** Image height in pixels */
    imageHeight: number;
    /** Image width in pixels */
    imageWidth: number;
    /** Person associated with face */
    person: (PersonResponseDto) | null;
    /** Face detection source type */
    sourceType?: SourceType;
};
export type AssetFaceCreateDto = {
    /** Asset ID */
    assetId: string;
    /** Face bounding box height */
    height: number;
    /** Image height in pixels */
    imageHeight: number;
    /** Image width in pixels */
    imageWidth: number;
    /** Person ID */
    personId: string;
    /** Face bounding box width */
    width: number;
    /** Face bounding box X coordinate */
    x: number;
    /** Face bounding box Y coordinate */
    y: number;
};
export type AssetFaceDeleteDto = {
    /** Force delete even if person has other faces */
    force: boolean;
};
export type FaceDto = {
    /** Face ID */
    id: string;
};
export type QueueStatisticsDto = {
    /** Number of active jobs */
    active: number;
    /** Number of completed jobs */
    completed: number;
    /** Number of delayed jobs */
    delayed: number;
    /** Number of failed jobs */
    failed: number;
    /** Number of paused jobs */
    paused: number;
    /** Number of waiting jobs */
    waiting: number;
};
export type QueueStatusLegacyDto = {
    /** Whether the queue is currently active (has running jobs) */
    isActive: boolean;
    /** Whether the queue is paused */
    isPaused: boolean;
};
export type QueueResponseLegacyDto = {
    jobCounts: QueueStatisticsDto;
    queueStatus: QueueStatusLegacyDto;
};
export type QueuesResponseLegacyDto = {
    backgroundTask: QueueResponseLegacyDto;
    backupDatabase: QueueResponseLegacyDto;
    duplicateDetection: QueueResponseLegacyDto;
    editor: QueueResponseLegacyDto;
    faceDetection: QueueResponseLegacyDto;
    facialRecognition: QueueResponseLegacyDto;
    library: QueueResponseLegacyDto;
    metadataExtraction: QueueResponseLegacyDto;
    migration: QueueResponseLegacyDto;
    notifications: QueueResponseLegacyDto;
    ocr: QueueResponseLegacyDto;
    search: QueueResponseLegacyDto;
    sidecar: QueueResponseLegacyDto;
    smartSearch: QueueResponseLegacyDto;
    storageTemplateMigration: QueueResponseLegacyDto;
    thumbnailGeneration: QueueResponseLegacyDto;
    videoConversion: QueueResponseLegacyDto;
    workflow: QueueResponseLegacyDto;
};
export type JobCreateDto = {
    /** Job name */
    name: ManualJobName;
};
export type QueueCommandDto = {
    /** Queue command to execute */
    command: QueueCommand;
    /** Force the command execution (if applicable) */
    force?: boolean;
};
export type LibraryResponseDto = {
    /** Number of assets */
    assetCount: number;
    /** Creation date */
    createdAt: string;
    /** Exclusion patterns */
    exclusionPatterns: string[];
    /** Library ID */
    id: string;
    /** Import paths */
    importPaths: string[];
    /** Library name */
    name: string;
    /** Owner user ID */
    ownerId: string;
    /** Last refresh date */
    refreshedAt: string | null;
    /** Last update date */
    updatedAt: string;
};
export type CreateLibraryDto = {
    /** Exclusion patterns (max 128) */
    exclusionPatterns?: string[];
    /** Import paths (max 128) */
    importPaths?: string[];
    /** Library name */
    name?: string;
    /** Owner user ID */
    ownerId: string;
};
export type UpdateLibraryDto = {
    /** Exclusion patterns (max 128) */
    exclusionPatterns?: string[];
    /** Import paths (max 128) */
    importPaths?: string[];
    /** Library name */
    name?: string;
};
export type LibraryStatsResponseDto = {
    /** Number of photos */
    photos: number;
    /** Total number of assets */
    total: number;
    /** Storage usage in bytes */
    usage: number;
    /** Number of videos */
    videos: number;
};
export type ValidateLibraryDto = {
    /** Exclusion patterns (max 128) */
    exclusionPatterns?: string[];
    /** Import paths to validate (max 128) */
    importPaths?: string[];
};
export type ValidateLibraryImportPathResponseDto = {
    /** Import path */
    importPath: string;
    /** Is valid */
    isValid: boolean;
    /** Validation message */
    message?: string;
};
export type ValidateLibraryResponseDto = {
    /** Validation results for import paths */
    importPaths?: ValidateLibraryImportPathResponseDto[];
};
export type MapMarkerResponseDto = {
    /** City name */
    city: string | null;
    /** Country name */
    country: string | null;
    /** Asset ID */
    id: string;
    /** Latitude */
    lat: number;
    /** Longitude */
    lon: number;
    /** State/Province name */
    state: string | null;
};
export type MapReverseGeocodeResponseDto = {
    /** City name */
    city: string | null;
    /** Country name */
    country: string | null;
    /** State/Province name */
    state: string | null;
};
export type OnThisDayDto = {
    /** Year for on this day memory */
    year: number;
};
export type MemoryResponseDto = {
    assets: AssetResponseDto[];
    /** Creation date */
    createdAt: string;
    data: OnThisDayDto;
    /** Deletion date */
    deletedAt?: string;
    /** Date when memory should be hidden */
    hideAt?: string;
    /** Memory ID */
    id: string;
    /** Is memory saved */
    isSaved: boolean;
    /** Memory date */
    memoryAt: string;
    /** Owner user ID */
    ownerId: string;
    /** Date when memory was seen */
    seenAt?: string;
    /** Date when memory should be shown */
    showAt?: string;
    /** Memory type */
    "type": MemoryType;
    /** Last update date */
    updatedAt: string;
};
export type MemoryCreateDto = {
    /** Asset IDs to associate with memory */
    assetIds?: string[];
    data: OnThisDayDto;
    /** Date when memory should be hidden */
    hideAt?: string;
    /** Is memory saved */
    isSaved?: boolean;
    /** Memory date */
    memoryAt: string;
    /** Date when memory was seen */
    seenAt?: string;
    /** Date when memory should be shown */
    showAt?: string;
    /** Memory type */
    "type": MemoryType;
};
export type MemoryStatisticsResponseDto = {
    /** Total number of memories */
    total: number;
};
export type MemoryUpdateDto = {
    /** Is memory saved */
    isSaved?: boolean;
    /** Memory date */
    memoryAt?: string;
    /** Date when memory was seen */
    seenAt?: string;
};
export type NotificationDeleteAllDto = {
    /** Notification IDs to delete */
    ids: string[];
};
export type NotificationUpdateAllDto = {
    /** Notification IDs to update */
    ids: string[];
    /** Date when notifications were read */
    readAt?: string | null;
};
export type NotificationUpdateDto = {
    /** Date when notification was read */
    readAt?: string | null;
};
export type OAuthConfigDto = {
    /** OAuth code challenge (PKCE) */
    codeChallenge?: string;
    /** OAuth redirect URI */
    redirectUri: string;
    /** OAuth state parameter */
    state?: string;
};
export type OAuthAuthorizeResponseDto = {
    /** OAuth authorization URL */
    url: string;
};
export type OAuthCallbackDto = {
    /** OAuth code verifier (PKCE) */
    codeVerifier?: string;
    /** OAuth state parameter */
    state?: string;
    /** OAuth callback URL */
    url: string;
};
export type PartnerResponseDto = {
    /** Avatar color */
    avatarColor: UserAvatarColor;
    /** User email */
    email: string;
    /** User ID */
    id: string;
    /** Show in timeline */
    inTimeline?: boolean;
    /** User name */
    name: string;
    /** Profile change date */
    profileChangedAt: string;
    /** Profile image path */
    profileImagePath: string;
};
export type PartnerCreateDto = {
    /** User ID to share with */
    sharedWithId: string;
};
export type PartnerUpdateDto = {
    /** Show partner assets in timeline */
    inTimeline: boolean;
};
export type PeopleResponseDto = {
    /** Whether there are more pages */
    hasNextPage?: boolean;
    /** Number of hidden people */
    hidden: number;
    /** List of people */
    people: PersonResponseDto[];
    /** Total number of people */
    total: number;
};
export type PersonCreateDto = {
    /** Person date of birth */
    birthDate?: string | null;
    /** Person color (hex) */
    color?: string | null;
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Person visibility (hidden) */
    isHidden?: boolean;
    /** Person name */
    name?: string;
};
export type PeopleUpdateItem = {
    /** Person date of birth */
    birthDate?: string | null;
    /** Person color (hex) */
    color?: string | null;
    /** Asset ID used for feature face thumbnail */
    featureFaceAssetId?: string;
    /** Person ID */
    id: string;
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Person visibility (hidden) */
    isHidden?: boolean;
    /** Person name */
    name?: string;
};
export type PeopleUpdateDto = {
    /** People to update */
    people: PeopleUpdateItem[];
};
export type PersonUpdateDto = {
    /** Person date of birth */
    birthDate?: string | null;
    /** Person color (hex) */
    color?: string | null;
    /** Asset ID used for feature face thumbnail */
    featureFaceAssetId?: string;
    /** Mark as favorite */
    isFavorite?: boolean;
    /** Person visibility (hidden) */
    isHidden?: boolean;
    /** Person name */
    name?: string;
};
export type MergePersonDto = {
    /** Person IDs to merge */
    ids: string[];
};
export type AssetFaceUpdateItem = {
    /** Asset ID */
    assetId: string;
    /** Person ID */
    personId: string;
};
export type AssetFaceUpdateDto = {
    /** Face update items */
    data: AssetFaceUpdateItem[];
};
export type PersonStatisticsResponseDto = {
    /** Number of assets */
    assets: number;
};
export type PluginActionResponseDto = {
    /** Action description */
    description: string;
    /** Action ID */
    id: string;
    /** Method name */
    methodName: string;
    /** Plugin ID */
    pluginId: string;
    /** Action schema */
    schema: object | null;
    /** Supported contexts */
    supportedContexts: PluginContextType[];
    /** Action title */
    title: string;
};
export type PluginFilterResponseDto = {
    /** Filter description */
    description: string;
    /** Filter ID */
    id: string;
    /** Method name */
    methodName: string;
    /** Plugin ID */
    pluginId: string;
    /** Filter schema */
    schema: object | null;
    /** Supported contexts */
    supportedContexts: PluginContextType[];
    /** Filter title */
    title: string;
};
export type PluginResponseDto = {
    /** Plugin actions */
    actions: PluginActionResponseDto[];
    /** Plugin author */
    author: string;
    /** Creation date */
    createdAt: string;
    /** Plugin description */
    description: string;
    /** Plugin filters */
    filters: PluginFilterResponseDto[];
    /** Plugin ID */
    id: string;
    /** Plugin name */
    name: string;
    /** Plugin title */
    title: string;
    /** Last update date */
    updatedAt: string;
    /** Plugin version */
    version: string;
};
export type PluginTriggerResponseDto = {
    /** Context type */
    contextType: PluginContextType;
    /** Trigger type */
    "type": PluginTriggerType;
};
export type QueueResponseDto = {
    /** Whether the queue is paused */
    isPaused: boolean;
    /** Queue name */
    name: QueueName;
    statistics: QueueStatisticsDto;
};
export type QueueUpdateDto = {
    /** Whether to pause the queue */
    isPaused?: boolean;
};
export type QueueDeleteDto = {
    /** If true, will also remove failed jobs from the queue. */
    failed?: boolean;
};
export type QueueJobResponseDto = {
    /** Job data payload */
    data: object;
    /** Job ID */
    id?: string;
    /** Job name */
    name: JobName;
    /** Job creation timestamp */
    timestamp: number;
};
export type SearchExploreItem = {
    data: AssetResponseDto;
    /** Explore value */
    value: string;
};
export type SearchExploreResponseDto = {
    /** Explore field name */
    fieldName: string;
    items: SearchExploreItem[];
};
export type MetadataSearchDto = {
    /** Filter by album IDs */
    albumIds?: string[];
    /** Filter by file checksum */
    checksum?: string;
    /** Filter by city name */
    city?: string | null;
    /** Filter by country name */
    country?: string | null;
    /** Filter by creation date (after) */
    createdAfter?: string;
    /** Filter by creation date (before) */
    createdBefore?: string;
    /** Filter by description text */
    description?: string;
    /** Filter by device asset ID */
    deviceAssetId?: string;
    /** Device ID to filter by */
    deviceId?: string;
    /** Filter by encoded video file path */
    encodedVideoPath?: string;
    /** Filter by asset ID */
    id?: string;
    /** Filter by encoded status */
    isEncoded?: boolean;
    /** Filter by favorite status */
    isFavorite?: boolean;
    /** Filter by motion photo status */
    isMotion?: boolean;
    /** Filter assets not in any album */
    isNotInAlbum?: boolean;
    /** Filter by offline status */
    isOffline?: boolean;
    /** Filter by lens model */
    lensModel?: string | null;
    /** Library ID to filter by */
    libraryId?: string | null;
    /** Filter by camera make */
    make?: string;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Sort order */
    order?: AssetOrder;
    /** Filter by original file name */
    originalFileName?: string;
    /** Filter by original file path */
    originalPath?: string;
    /** Page number */
    page?: number;
    /** Filter by person IDs */
    personIds?: string[];
    /** Filter by preview file path */
    previewPath?: string;
    /** Filter by rating */
    rating?: number;
    /** Number of results to return */
    size?: number;
    /** Filter by state/province name */
    state?: string | null;
    /** Filter by tag IDs */
    tagIds?: string[] | null;
    /** Filter by taken date (after) */
    takenAfter?: string;
    /** Filter by taken date (before) */
    takenBefore?: string;
    /** Filter by thumbnail file path */
    thumbnailPath?: string;
    /** Filter by trash date (after) */
    trashedAfter?: string;
    /** Filter by trash date (before) */
    trashedBefore?: string;
    /** Asset type filter */
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    /** Filter by visibility */
    visibility?: AssetVisibility;
    /** Include deleted assets */
    withDeleted?: boolean;
    /** Include EXIF data in response */
    withExif?: boolean;
    /** Include assets with people */
    withPeople?: boolean;
    /** Include stacked assets */
    withStacked?: boolean;
};
export type SearchFacetCountResponseDto = {
    /** Number of assets with this facet value */
    count: number;
    /** Facet value */
    value: string;
};
export type SearchFacetResponseDto = {
    /** Facet counts */
    counts: SearchFacetCountResponseDto[];
    /** Facet field name */
    fieldName: string;
};
export type SearchAlbumResponseDto = {
    /** Number of albums in this page */
    count: number;
    facets: SearchFacetResponseDto[];
    items: AlbumResponseDto[];
    /** Total number of matching albums */
    total: number;
};
export type SearchAssetResponseDto = {
    /** Number of assets in this page */
    count: number;
    facets: SearchFacetResponseDto[];
    items: AssetResponseDto[];
    /** Next page token */
    nextPage: string | null;
    /** Total number of matching assets */
    total: number;
};
export type SearchResponseDto = {
    albums: SearchAlbumResponseDto;
    assets: SearchAssetResponseDto;
};
export type PlacesResponseDto = {
    /** Administrative level 1 name (state/province) */
    admin1name?: string;
    /** Administrative level 2 name (county/district) */
    admin2name?: string;
    /** Latitude coordinate */
    latitude: number;
    /** Longitude coordinate */
    longitude: number;
    /** Place name */
    name: string;
};
export type RandomSearchDto = {
    /** Filter by album IDs */
    albumIds?: string[];
    /** Filter by city name */
    city?: string | null;
    /** Filter by country name */
    country?: string | null;
    /** Filter by creation date (after) */
    createdAfter?: string;
    /** Filter by creation date (before) */
    createdBefore?: string;
    /** Device ID to filter by */
    deviceId?: string;
    /** Filter by encoded status */
    isEncoded?: boolean;
    /** Filter by favorite status */
    isFavorite?: boolean;
    /** Filter by motion photo status */
    isMotion?: boolean;
    /** Filter assets not in any album */
    isNotInAlbum?: boolean;
    /** Filter by offline status */
    isOffline?: boolean;
    /** Filter by lens model */
    lensModel?: string | null;
    /** Library ID to filter by */
    libraryId?: string | null;
    /** Filter by camera make */
    make?: string;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Filter by person IDs */
    personIds?: string[];
    /** Filter by rating */
    rating?: number;
    /** Number of results to return */
    size?: number;
    /** Filter by state/province name */
    state?: string | null;
    /** Filter by tag IDs */
    tagIds?: string[] | null;
    /** Filter by taken date (after) */
    takenAfter?: string;
    /** Filter by taken date (before) */
    takenBefore?: string;
    /** Filter by trash date (after) */
    trashedAfter?: string;
    /** Filter by trash date (before) */
    trashedBefore?: string;
    /** Asset type filter */
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    /** Filter by visibility */
    visibility?: AssetVisibility;
    /** Include deleted assets */
    withDeleted?: boolean;
    /** Include EXIF data in response */
    withExif?: boolean;
    /** Include assets with people */
    withPeople?: boolean;
    /** Include stacked assets */
    withStacked?: boolean;
};
export type SmartSearchDto = {
    /** Filter by album IDs */
    albumIds?: string[];
    /** Filter by city name */
    city?: string | null;
    /** Filter by country name */
    country?: string | null;
    /** Filter by creation date (after) */
    createdAfter?: string;
    /** Filter by creation date (before) */
    createdBefore?: string;
    /** Device ID to filter by */
    deviceId?: string;
    /** Filter by encoded status */
    isEncoded?: boolean;
    /** Filter by favorite status */
    isFavorite?: boolean;
    /** Filter by motion photo status */
    isMotion?: boolean;
    /** Filter assets not in any album */
    isNotInAlbum?: boolean;
    /** Filter by offline status */
    isOffline?: boolean;
    /** Search language code */
    language?: string;
    /** Filter by lens model */
    lensModel?: string | null;
    /** Library ID to filter by */
    libraryId?: string | null;
    /** Filter by camera make */
    make?: string;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Page number */
    page?: number;
    /** Filter by person IDs */
    personIds?: string[];
    /** Natural language search query */
    query?: string;
    /** Asset ID to use as search reference */
    queryAssetId?: string;
    /** Filter by rating */
    rating?: number;
    /** Number of results to return */
    size?: number;
    /** Filter by state/province name */
    state?: string | null;
    /** Filter by tag IDs */
    tagIds?: string[] | null;
    /** Filter by taken date (after) */
    takenAfter?: string;
    /** Filter by taken date (before) */
    takenBefore?: string;
    /** Filter by trash date (after) */
    trashedAfter?: string;
    /** Filter by trash date (before) */
    trashedBefore?: string;
    /** Asset type filter */
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    /** Filter by visibility */
    visibility?: AssetVisibility;
    /** Include deleted assets */
    withDeleted?: boolean;
    /** Include EXIF data in response */
    withExif?: boolean;
};
export type StatisticsSearchDto = {
    /** Filter by album IDs */
    albumIds?: string[];
    /** Filter by city name */
    city?: string | null;
    /** Filter by country name */
    country?: string | null;
    /** Filter by creation date (after) */
    createdAfter?: string;
    /** Filter by creation date (before) */
    createdBefore?: string;
    /** Filter by description text */
    description?: string;
    /** Device ID to filter by */
    deviceId?: string;
    /** Filter by encoded status */
    isEncoded?: boolean;
    /** Filter by favorite status */
    isFavorite?: boolean;
    /** Filter by motion photo status */
    isMotion?: boolean;
    /** Filter assets not in any album */
    isNotInAlbum?: boolean;
    /** Filter by offline status */
    isOffline?: boolean;
    /** Filter by lens model */
    lensModel?: string | null;
    /** Library ID to filter by */
    libraryId?: string | null;
    /** Filter by camera make */
    make?: string;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Filter by person IDs */
    personIds?: string[];
    /** Filter by rating */
    rating?: number;
    /** Filter by state/province name */
    state?: string | null;
    /** Filter by tag IDs */
    tagIds?: string[] | null;
    /** Filter by taken date (after) */
    takenAfter?: string;
    /** Filter by taken date (before) */
    takenBefore?: string;
    /** Filter by trash date (after) */
    trashedAfter?: string;
    /** Filter by trash date (before) */
    trashedBefore?: string;
    /** Asset type filter */
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    /** Filter by visibility */
    visibility?: AssetVisibility;
};
export type SearchStatisticsResponseDto = {
    /** Total number of matching assets */
    total: number;
};
export type ServerAboutResponseDto = {
    /** Build identifier */
    build?: string;
    /** Build image name */
    buildImage?: string;
    /** Build image URL */
    buildImageUrl?: string;
    /** Build URL */
    buildUrl?: string;
    /** ExifTool version */
    exiftool?: string;
    /** FFmpeg version */
    ffmpeg?: string;
    /** ImageMagick version */
    imagemagick?: string;
    /** libvips version */
    libvips?: string;
    /** Whether the server is licensed */
    licensed: boolean;
    /** Node.js version */
    nodejs?: string;
    /** Repository name */
    repository?: string;
    /** Repository URL */
    repositoryUrl?: string;
    /** Source commit hash */
    sourceCommit?: string;
    /** Source reference (branch/tag) */
    sourceRef?: string;
    /** Source URL */
    sourceUrl?: string;
    /** Third-party bug/feature URL */
    thirdPartyBugFeatureUrl?: string;
    /** Third-party documentation URL */
    thirdPartyDocumentationUrl?: string;
    /** Third-party source URL */
    thirdPartySourceUrl?: string;
    /** Third-party support URL */
    thirdPartySupportUrl?: string;
    /** Server version */
    version: string;
    /** URL to version information */
    versionUrl: string;
};
export type ServerApkLinksDto = {
    /** APK download link for ARM64 v8a architecture */
    arm64v8a: string;
    /** APK download link for ARM EABI v7a architecture */
    armeabiv7a: string;
    /** APK download link for universal architecture */
    universal: string;
    /** APK download link for x86_64 architecture */
    x86_64: string;
};
export type ServerConfigDto = {
    /** External domain URL */
    externalDomain: string;
    /** Whether the server has been initialized */
    isInitialized: boolean;
    /** Whether the admin has completed onboarding */
    isOnboarded: boolean;
    /** Login page message */
    loginPageMessage: string;
    /** Whether maintenance mode is active */
    maintenanceMode: boolean;
    /** Map dark style URL */
    mapDarkStyleUrl: string;
    /** Map light style URL */
    mapLightStyleUrl: string;
    /** OAuth button text */
    oauthButtonText: string;
    /** Whether public user registration is enabled */
    publicUsers: boolean;
    /** Number of days before trashed assets are permanently deleted */
    trashDays: number;
    /** Delay in days before deleted users are permanently removed */
    userDeleteDelay: number;
};
export type ServerFeaturesDto = {
    /** Whether config file is available */
    configFile: boolean;
    /** Whether duplicate detection is enabled */
    duplicateDetection: boolean;
    /** Whether email notifications are enabled */
    email: boolean;
    /** Whether facial recognition is enabled */
    facialRecognition: boolean;
    /** Whether face import is enabled */
    importFaces: boolean;
    /** Whether map feature is enabled */
    map: boolean;
    /** Whether OAuth is enabled */
    oauth: boolean;
    /** Whether OAuth auto-launch is enabled */
    oauthAutoLaunch: boolean;
    /** Whether OCR is enabled */
    ocr: boolean;
    /** Whether password login is enabled */
    passwordLogin: boolean;
    /** Whether reverse geocoding is enabled */
    reverseGeocoding: boolean;
    /** Whether search is enabled */
    search: boolean;
    /** Whether sidecar files are supported */
    sidecar: boolean;
    /** Whether smart search is enabled */
    smartSearch: boolean;
    /** Whether trash feature is enabled */
    trash: boolean;
};
export type LicenseResponseDto = {
    /** Activation date */
    activatedAt: string;
    /** Activation key */
    activationKey: string;
    /** License key (format: IM(SV|CL)(-XXXX){8}) */
    licenseKey: string;
};
export type LicenseKeyDto = {
    /** Activation key */
    activationKey: string;
    /** License key (format: IM(SV|CL)(-XXXX){8}) */
    licenseKey: string;
};
export type ServerMediaTypesResponseDto = {
    /** Supported image MIME types */
    image: string[];
    /** Supported sidecar MIME types */
    sidecar: string[];
    /** Supported video MIME types */
    video: string[];
};
export type ServerPingResponse = {};
export type ServerPingResponseRead = {
    res: string;
};
export type UsageByUserDto = {
    /** Number of photos */
    photos: number;
    /** User quota size in bytes (null if unlimited) */
    quotaSizeInBytes: number | null;
    /** Total storage usage in bytes */
    usage: number;
    /** Storage usage for photos in bytes */
    usagePhotos: number;
    /** Storage usage for videos in bytes */
    usageVideos: number;
    /** User ID */
    userId: string;
    /** User name */
    userName: string;
    /** Number of videos */
    videos: number;
};
export type ServerStatsResponseDto = {
    /** Total number of photos */
    photos: number;
    /** Total storage usage in bytes */
    usage: number;
    usageByUser: UsageByUserDto[];
    /** Storage usage for photos in bytes */
    usagePhotos: number;
    /** Storage usage for videos in bytes */
    usageVideos: number;
    /** Total number of videos */
    videos: number;
};
export type ServerStorageResponseDto = {
    /** Available disk space (human-readable format) */
    diskAvailable: string;
    /** Available disk space in bytes */
    diskAvailableRaw: number;
    /** Total disk size (human-readable format) */
    diskSize: string;
    /** Total disk size in bytes */
    diskSizeRaw: number;
    /** Disk usage percentage (0-100) */
    diskUsagePercentage: number;
    /** Used disk space (human-readable format) */
    diskUse: string;
    /** Used disk space in bytes */
    diskUseRaw: number;
};
export type ServerThemeDto = {
    /** Custom CSS for theming */
    customCss: string;
};
export type ServerVersionResponseDto = {
    /** Major version number */
    major: number;
    /** Minor version number */
    minor: number;
    /** Patch version number */
    patch: number;
};
export type VersionCheckStateResponseDto = {
    /** Last check timestamp */
    checkedAt: string | null;
    /** Release version */
    releaseVersion: string | null;
};
export type ServerVersionHistoryResponseDto = {
    /** When this version was first seen */
    createdAt: string;
    /** Version history entry ID */
    id: string;
    /** Version string */
    version: string;
};
export type SessionCreateDto = {
    /** Device OS */
    deviceOS?: string;
    /** Device type */
    deviceType?: string;
    /** Session duration in seconds */
    duration?: number;
};
export type SessionCreateResponseDto = {
    /** App version */
    appVersion: string | null;
    /** Creation date */
    createdAt: string;
    /** Is current session */
    current: boolean;
    /** Device OS */
    deviceOS: string;
    /** Device type */
    deviceType: string;
    /** Expiration date */
    expiresAt?: string;
    /** Session ID */
    id: string;
    /** Is pending sync reset */
    isPendingSyncReset: boolean;
    /** Session token */
    token: string;
    /** Last update date */
    updatedAt: string;
};
export type SessionUpdateDto = {
    /** Reset pending sync state */
    isPendingSyncReset?: boolean;
};
export type SharedLinkResponseDto = {
    album?: AlbumResponseDto;
    /** Allow downloads */
    allowDownload: boolean;
    /** Allow uploads */
    allowUpload: boolean;
    assets: AssetResponseDto[];
    /** Creation date */
    createdAt: string;
    /** Link description */
    description: string | null;
    /** Expiration date */
    expiresAt: string | null;
    /** Shared link ID */
    id: string;
    /** Encryption key (base64url) */
    key: string;
    /** Has password */
    password: string | null;
    /** Show metadata */
    showMetadata: boolean;
    /** Custom URL slug */
    slug: string | null;
    /** Access token */
    token?: string | null;
    /** Shared link type */
    "type": SharedLinkType;
    /** Owner user ID */
    userId: string;
};
export type SharedLinkCreateDto = {
    /** Album ID (for album sharing) */
    albumId?: string;
    /** Allow downloads */
    allowDownload?: boolean;
    /** Allow uploads */
    allowUpload?: boolean;
    /** Asset IDs (for individual assets) */
    assetIds?: string[];
    /** Link description */
    description?: string | null;
    /** Expiration date */
    expiresAt?: string | null;
    /** Link password */
    password?: string | null;
    /** Show metadata */
    showMetadata?: boolean;
    /** Custom URL slug */
    slug?: string | null;
    /** Shared link type */
    "type": SharedLinkType;
};
export type SharedLinkLoginDto = {
    /** Shared link password */
    password: string;
};
export type SharedLinkEditDto = {
    /** Allow downloads */
    allowDownload?: boolean;
    /** Allow uploads */
    allowUpload?: boolean;
    /** Whether to change the expiry time. Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this. */
    changeExpiryTime?: boolean;
    /** Link description */
    description?: string | null;
    /** Expiration date */
    expiresAt?: string | null;
    /** Link password */
    password?: string | null;
    /** Show metadata */
    showMetadata?: boolean;
    /** Custom URL slug */
    slug?: string | null;
};
export type AssetIdsDto = {
    /** Asset IDs */
    assetIds: string[];
};
export type AssetIdsResponseDto = {
    /** Asset ID */
    assetId: string;
    /** Error reason if failed */
    error?: Error2;
    /** Whether operation succeeded */
    success: boolean;
};
export type StackResponseDto = {
    /** Stack assets */
    assets: AssetResponseDto[];
    /** Stack ID */
    id: string;
    /** Primary asset ID */
    primaryAssetId: string;
};
export type StackCreateDto = {
    /** Asset IDs (first becomes primary, min 2) */
    assetIds: string[];
};
export type StackUpdateDto = {
    /** Primary asset ID */
    primaryAssetId?: string;
};
export type SyncAckDeleteDto = {
    /** Sync entity types to delete acks for */
    types?: SyncEntityType[];
};
export type SyncAckDto = {
    /** Acknowledgment ID */
    ack: string;
    /** Sync entity type */
    "type": SyncEntityType;
};
export type SyncAckSetDto = {
    /** Acknowledgment IDs (max 1000) */
    acks: string[];
};
export type AssetDeltaSyncDto = {
    /** Sync assets updated after this date */
    updatedAfter: string;
    /** User IDs to sync */
    userIds: string[];
};
export type AssetDeltaSyncResponseDto = {
    /** Deleted asset IDs */
    deleted: string[];
    /** Whether full sync is needed */
    needsFullSync: boolean;
    /** Upserted assets */
    upserted: AssetResponseDto[];
};
export type AssetFullSyncDto = {
    /** Last asset ID (pagination) */
    lastId?: string;
    /** Maximum number of assets to return */
    limit: number;
    /** Sync assets updated until this date */
    updatedUntil: string;
    /** Filter by user ID */
    userId?: string;
};
export type SyncStreamDto = {
    /** Reset sync state */
    reset?: boolean;
    /** Sync request types */
    types: SyncRequestType[];
};
export type DatabaseBackupConfig = {
    /** Cron expression */
    cronExpression: string;
    /** Enabled */
    enabled: boolean;
    /** Keep last amount */
    keepLastAmount: number;
};
export type SystemConfigBackupsDto = {
    database: DatabaseBackupConfig;
};
export type SystemConfigFFmpegDto = {
    /** Transcode hardware acceleration */
    accel: TranscodeHWAccel;
    /** Accelerated decode */
    accelDecode: boolean;
    /** Accepted audio codecs */
    acceptedAudioCodecs: AudioCodec[];
    /** Accepted containers */
    acceptedContainers: VideoContainer[];
    /** Accepted video codecs */
    acceptedVideoCodecs: VideoCodec[];
    /** B-frames */
    bframes: number;
    /** CQ mode */
    cqMode: CQMode;
    /** CRF */
    crf: number;
    /** GOP size */
    gopSize: number;
    /** Max bitrate */
    maxBitrate: string;
    /** Preferred hardware device */
    preferredHwDevice: string;
    /** Preset */
    preset: string;
    /** References */
    refs: number;
    /** Target audio codec */
    targetAudioCodec: AudioCodec;
    /** Target resolution */
    targetResolution: string;
    /** Target video codec */
    targetVideoCodec: VideoCodec;
    /** Temporal AQ */
    temporalAQ: boolean;
    /** Threads */
    threads: number;
    /** Tone mapping */
    tonemap: ToneMapping;
    /** Transcode policy */
    transcode: TranscodePolicy;
    /** Two pass */
    twoPass: boolean;
};
export type SystemConfigGeneratedFullsizeImageDto = {
    /** Enabled */
    enabled: boolean;
    /** Image format */
    format: ImageFormat;
    /** Progressive */
    progressive?: boolean;
    /** Quality */
    quality: number;
};
export type SystemConfigGeneratedImageDto = {
    /** Image format */
    format: ImageFormat;
    progressive?: boolean;
    /** Quality */
    quality: number;
    /** Size */
    size: number;
};
export type SystemConfigImageDto = {
    /** Colorspace */
    colorspace: Colorspace;
    /** Extract embedded */
    extractEmbedded: boolean;
    fullsize: SystemConfigGeneratedFullsizeImageDto;
    preview: SystemConfigGeneratedImageDto;
    thumbnail: SystemConfigGeneratedImageDto;
};
export type JobSettingsDto = {
    /** Concurrency */
    concurrency: number;
};
export type SystemConfigJobDto = {
    backgroundTask: JobSettingsDto;
    editor: JobSettingsDto;
    faceDetection: JobSettingsDto;
    library: JobSettingsDto;
    metadataExtraction: JobSettingsDto;
    migration: JobSettingsDto;
    notifications: JobSettingsDto;
    ocr: JobSettingsDto;
    search: JobSettingsDto;
    sidecar: JobSettingsDto;
    smartSearch: JobSettingsDto;
    thumbnailGeneration: JobSettingsDto;
    videoConversion: JobSettingsDto;
    workflow: JobSettingsDto;
};
export type SystemConfigLibraryScanDto = {
    cronExpression: string;
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigLibraryWatchDto = {
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigLibraryDto = {
    scan: SystemConfigLibraryScanDto;
    watch: SystemConfigLibraryWatchDto;
};
export type SystemConfigLoggingDto = {
    /** Enabled */
    enabled: boolean;
    level: LogLevel;
};
export type MachineLearningAvailabilityChecksDto = {
    /** Enabled */
    enabled: boolean;
    interval: number;
    timeout: number;
};
export type ClipConfig = {
    /** Whether the task is enabled */
    enabled: boolean;
    /** Name of the model to use */
    modelName: string;
};
export type DuplicateDetectionConfig = {
    /** Whether the task is enabled */
    enabled: boolean;
    /** Maximum distance threshold for duplicate detection */
    maxDistance: number;
};
export type FacialRecognitionConfig = {
    /** Whether the task is enabled */
    enabled: boolean;
    /** Maximum distance threshold for face recognition */
    maxDistance: number;
    /** Minimum number of faces required for recognition */
    minFaces: number;
    /** Minimum confidence score for face detection */
    minScore: number;
    /** Name of the model to use */
    modelName: string;
};
export type OcrConfig = {
    /** Whether the task is enabled */
    enabled: boolean;
    /** Maximum resolution for OCR processing */
    maxResolution: number;
    /** Minimum confidence score for text detection */
    minDetectionScore: number;
    /** Minimum confidence score for text recognition */
    minRecognitionScore: number;
    /** Name of the model to use */
    modelName: string;
};
export type SystemConfigMachineLearningDto = {
    availabilityChecks: MachineLearningAvailabilityChecksDto;
    clip: ClipConfig;
    duplicateDetection: DuplicateDetectionConfig;
    /** Enabled */
    enabled: boolean;
    facialRecognition: FacialRecognitionConfig;
    ocr: OcrConfig;
    urls: string[];
};
export type SystemConfigMapDto = {
    darkStyle: string;
    /** Enabled */
    enabled: boolean;
    lightStyle: string;
};
export type SystemConfigFacesDto = {
    /** Import */
    "import": boolean;
};
export type SystemConfigMetadataDto = {
    faces: SystemConfigFacesDto;
};
export type SystemConfigNewVersionCheckDto = {
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigNightlyTasksDto = {
    /** Cluster new faces */
    clusterNewFaces: boolean;
    /** Database cleanup */
    databaseCleanup: boolean;
    /** Generate memories */
    generateMemories: boolean;
    /** Missing thumbnails */
    missingThumbnails: boolean;
    startTime: string;
    /** Sync quota usage */
    syncQuotaUsage: boolean;
};
export type SystemConfigNotificationsDto = {
    smtp: SystemConfigSmtpDto;
};
export type SystemConfigOAuthDto = {
    /** Auto launch */
    autoLaunch: boolean;
    /** Auto register */
    autoRegister: boolean;
    /** Button text */
    buttonText: string;
    /** Client ID */
    clientId: string;
    /** Client secret */
    clientSecret: string;
    /** Default storage quota */
    defaultStorageQuota: number | null;
    /** Enabled */
    enabled: boolean;
    /** Issuer URL */
    issuerUrl: string;
    /** Mobile override enabled */
    mobileOverrideEnabled: boolean;
    /** Mobile redirect URI */
    mobileRedirectUri: string;
    /** Profile signing algorithm */
    profileSigningAlgorithm: string;
    /** Role claim */
    roleClaim: string;
    /** Scope */
    scope: string;
    signingAlgorithm: string;
    /** Storage label claim */
    storageLabelClaim: string;
    /** Storage quota claim */
    storageQuotaClaim: string;
    /** Timeout */
    timeout: number;
    /** Token endpoint auth method */
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod;
};
export type SystemConfigPasswordLoginDto = {
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigReverseGeocodingDto = {
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigServerDto = {
    /** External domain */
    externalDomain: string;
    /** Login page message */
    loginPageMessage: string;
    /** Public users */
    publicUsers: boolean;
};
export type SystemConfigStorageTemplateDto = {
    /** Enabled */
    enabled: boolean;
    /** Hash verification enabled */
    hashVerificationEnabled: boolean;
    /** Template */
    template: string;
};
export type SystemConfigTemplateEmailsDto = {
    albumInviteTemplate: string;
    albumUpdateTemplate: string;
    welcomeTemplate: string;
};
export type SystemConfigTemplatesDto = {
    email: SystemConfigTemplateEmailsDto;
};
export type SystemConfigThemeDto = {
    /** Custom CSS for theming */
    customCss: string;
};
export type SystemConfigTrashDto = {
    /** Days */
    days: number;
    /** Enabled */
    enabled: boolean;
};
export type SystemConfigUserDto = {
    /** Delete delay */
    deleteDelay: number;
};
export type SystemConfigDto = {
    backup: SystemConfigBackupsDto;
    ffmpeg: SystemConfigFFmpegDto;
    image: SystemConfigImageDto;
    job: SystemConfigJobDto;
    library: SystemConfigLibraryDto;
    logging: SystemConfigLoggingDto;
    machineLearning: SystemConfigMachineLearningDto;
    map: SystemConfigMapDto;
    metadata: SystemConfigMetadataDto;
    newVersionCheck: SystemConfigNewVersionCheckDto;
    nightlyTasks: SystemConfigNightlyTasksDto;
    notifications: SystemConfigNotificationsDto;
    oauth: SystemConfigOAuthDto;
    passwordLogin: SystemConfigPasswordLoginDto;
    reverseGeocoding: SystemConfigReverseGeocodingDto;
    server: SystemConfigServerDto;
    storageTemplate: SystemConfigStorageTemplateDto;
    templates: SystemConfigTemplatesDto;
    theme: SystemConfigThemeDto;
    trash: SystemConfigTrashDto;
    user: SystemConfigUserDto;
};
export type SystemConfigTemplateStorageOptionDto = {
    /** Available day format options for storage template */
    dayOptions: string[];
    /** Available hour format options for storage template */
    hourOptions: string[];
    /** Available minute format options for storage template */
    minuteOptions: string[];
    /** Available month format options for storage template */
    monthOptions: string[];
    /** Available preset template options */
    presetOptions: string[];
    /** Available second format options for storage template */
    secondOptions: string[];
    /** Available week format options for storage template */
    weekOptions: string[];
    /** Available year format options for storage template */
    yearOptions: string[];
};
export type AdminOnboardingUpdateDto = {
    /** Is admin onboarded */
    isOnboarded: boolean;
};
export type ReverseGeocodingStateResponseDto = {
    /** Last import file name */
    lastImportFileName: string | null;
    /** Last update timestamp */
    lastUpdate: string | null;
};
export type TagCreateDto = {
    /** Tag color (hex) */
    color?: string;
    /** Tag name */
    name: string;
    /** Parent tag ID */
    parentId?: string | null;
};
export type TagUpsertDto = {
    /** Tag names to upsert */
    tags: string[];
};
export type TagBulkAssetsDto = {
    /** Asset IDs */
    assetIds: string[];
    /** Tag IDs */
    tagIds: string[];
};
export type TagBulkAssetsResponseDto = {
    /** Number of assets tagged */
    count: number;
};
export type TagUpdateDto = {
    /** Tag color (hex) */
    color?: string | null;
};
export type TimeBucketAssetResponseDto = {
    /** Array of city names extracted from EXIF GPS data */
    city: (string | null)[];
    /** Array of country names extracted from EXIF GPS data */
    country: (string | null)[];
    /** Array of video durations in HH:MM:SS format (null for images) */
    duration: (string | null)[];
    /** Array of file creation timestamps in UTC */
    fileCreatedAt: string[];
    /** Array of asset IDs in the time bucket */
    id: string[];
    /** Array indicating whether each asset is favorited */
    isFavorite: boolean[];
    /** Array indicating whether each asset is an image (false for videos) */
    isImage: boolean[];
    /** Array indicating whether each asset is in the trash */
    isTrashed: boolean[];
    /** Array of latitude coordinates extracted from EXIF GPS data */
    latitude?: (number | null)[];
    /** Array of live photo video asset IDs (null for non-live photos) */
    livePhotoVideoId: (string | null)[];
    /** Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective. */
    localOffsetHours: number[];
    /** Array of longitude coordinates extracted from EXIF GPS data */
    longitude?: (number | null)[];
    /** Array of owner IDs for each asset */
    ownerId: string[];
    /** Array of projection types for 360° content (e.g., "EQUIRECTANGULAR", "CUBEFACE", "CYLINDRICAL") */
    projectionType: (string | null)[];
    /** Array of aspect ratios (width/height) for each asset */
    ratio: number[];
    /** Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets) */
    stack?: (string[] | null)[];
    /** Array of BlurHash strings for generating asset previews (base64 encoded) */
    thumbhash: (string | null)[];
    /** Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED) */
    visibility: AssetVisibility[];
};
export type TimeBucketsResponseDto = {
    /** Number of assets in this time bucket */
    count: number;
    /** Time bucket identifier in YYYY-MM-DD format representing the start of the time period */
    timeBucket: string;
};
export type TrashResponseDto = {
    /** Number of items in trash */
    count: number;
};
export type UserUpdateMeDto = {
    /** Avatar color */
    avatarColor?: (UserAvatarColor) | null;
    /** User email */
    email?: string;
    /** User name */
    name?: string;
    /** User password (deprecated, use change password endpoint) */
    password?: string;
};
export type OnboardingResponseDto = {
    /** Is user onboarded */
    isOnboarded: boolean;
};
export type OnboardingDto = {
    /** Is user onboarded */
    isOnboarded: boolean;
};
export type CreateProfileImageDto = {
    /** Profile image file */
    file: Blob;
};
export type CreateProfileImageResponseDto = {
    /** Profile image change date */
    profileChangedAt: string;
    /** Profile image file path */
    profileImagePath: string;
    /** User ID */
    userId: string;
};
export type WorkflowActionResponseDto = {
    /** Action configuration */
    actionConfig: object | null;
    /** Action ID */
    id: string;
    /** Action order */
    order: number;
    /** Plugin action ID */
    pluginActionId: string;
    /** Workflow ID */
    workflowId: string;
};
export type WorkflowFilterResponseDto = {
    /** Filter configuration */
    filterConfig: object | null;
    /** Filter ID */
    id: string;
    /** Filter order */
    order: number;
    /** Plugin filter ID */
    pluginFilterId: string;
    /** Workflow ID */
    workflowId: string;
};
export type WorkflowResponseDto = {
    /** Workflow actions */
    actions: WorkflowActionResponseDto[];
    /** Creation date */
    createdAt: string;
    /** Workflow description */
    description: string;
    /** Workflow enabled */
    enabled: boolean;
    /** Workflow filters */
    filters: WorkflowFilterResponseDto[];
    /** Workflow ID */
    id: string;
    /** Workflow name */
    name: string | null;
    /** Owner user ID */
    ownerId: string;
    /** Workflow trigger type */
    triggerType: PluginTriggerType;
};
export type WorkflowActionItemDto = {
    /** Action configuration */
    actionConfig?: object;
    /** Plugin action ID */
    pluginActionId: string;
};
export type WorkflowFilterItemDto = {
    /** Filter configuration */
    filterConfig?: object;
    /** Plugin filter ID */
    pluginFilterId: string;
};
export type WorkflowCreateDto = {
    /** Workflow actions */
    actions: WorkflowActionItemDto[];
    /** Workflow description */
    description?: string;
    /** Workflow enabled */
    enabled?: boolean;
    /** Workflow filters */
    filters: WorkflowFilterItemDto[];
    /** Workflow name */
    name: string;
    /** Workflow trigger type */
    triggerType: PluginTriggerType;
};
export type WorkflowUpdateDto = {
    /** Workflow actions */
    actions?: WorkflowActionItemDto[];
    /** Workflow description */
    description?: string;
    /** Workflow enabled */
    enabled?: boolean;
    /** Workflow filters */
    filters?: WorkflowFilterItemDto[];
    /** Workflow name */
    name?: string;
    /** Workflow trigger type */
    triggerType?: PluginTriggerType;
};
export type SyncAckV1 = {};
export type SyncAlbumDeleteV1 = {
    /** Album ID */
    albumId: string;
};
export type SyncAlbumToAssetDeleteV1 = {
    /** Album ID */
    albumId: string;
    /** Asset ID */
    assetId: string;
};
export type SyncAlbumToAssetV1 = {
    /** Album ID */
    albumId: string;
    /** Asset ID */
    assetId: string;
};
export type SyncAlbumUserDeleteV1 = {
    /** Album ID */
    albumId: string;
    /** User ID */
    userId: string;
};
export type SyncAlbumUserV1 = {
    /** Album ID */
    albumId: string;
    /** Album user role */
    role: AlbumUserRole;
    /** User ID */
    userId: string;
};
export type SyncAlbumV1 = {
    /** Created at */
    createdAt: string;
    /** Album description */
    description: string;
    /** Album ID */
    id: string;
    /** Is activity enabled */
    isActivityEnabled: boolean;
    /** Album name */
    name: string;
    order: AssetOrder;
    /** Owner ID */
    ownerId: string;
    /** Thumbnail asset ID */
    thumbnailAssetId: string | null;
    /** Updated at */
    updatedAt: string;
};
export type SyncAssetDeleteV1 = {
    /** Asset ID */
    assetId: string;
};
export type SyncAssetExifV1 = {
    /** Asset ID */
    assetId: string;
    /** City */
    city: string | null;
    /** Country */
    country: string | null;
    /** Date time original */
    dateTimeOriginal: string | null;
    /** Description */
    description: string | null;
    /** Exif image height */
    exifImageHeight: number | null;
    /** Exif image width */
    exifImageWidth: number | null;
    /** Exposure time */
    exposureTime: string | null;
    /** F number */
    fNumber: number | null;
    /** File size in byte */
    fileSizeInByte: number | null;
    /** Focal length */
    focalLength: number | null;
    /** FPS */
    fps: number | null;
    /** ISO */
    iso: number | null;
    /** Latitude */
    latitude: number | null;
    /** Lens model */
    lensModel: string | null;
    /** Longitude */
    longitude: number | null;
    /** Make */
    make: string | null;
    /** Model */
    model: string | null;
    /** Modify date */
    modifyDate: string | null;
    /** Orientation */
    orientation: string | null;
    /** Profile description */
    profileDescription: string | null;
    /** Projection type */
    projectionType: string | null;
    /** Rating */
    rating: number | null;
    /** State */
    state: string | null;
    /** Time zone */
    timeZone: string | null;
};
export type SyncAssetFaceDeleteV1 = {
    /** Asset face ID */
    assetFaceId: string;
};
export type SyncAssetFaceV1 = {
    /** Asset ID */
    assetId: string;
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    /** Asset face ID */
    id: string;
    imageHeight: number;
    imageWidth: number;
    /** Person ID */
    personId: string | null;
    /** Source type */
    sourceType: string;
};
export type SyncAssetFaceV2 = {
    /** Asset ID */
    assetId: string;
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    /** Face deleted at */
    deletedAt: string | null;
    /** Asset face ID */
    id: string;
    imageHeight: number;
    imageWidth: number;
    /** Is the face visible in the asset */
    isVisible: boolean;
    /** Person ID */
    personId: string | null;
    /** Source type */
    sourceType: string;
};
export type SyncAssetMetadataDeleteV1 = {
    /** Asset ID */
    assetId: string;
    /** Key */
    key: string;
};
export type SyncAssetMetadataV1 = {
    /** Asset ID */
    assetId: string;
    /** Key */
    key: string;
    /** Value */
    value: object;
};
export type SyncAssetV1 = {
    /** Checksum */
    checksum: string;
    /** Deleted at */
    deletedAt: string | null;
    /** Duration */
    duration: string | null;
    /** File created at */
    fileCreatedAt: string | null;
    /** File modified at */
    fileModifiedAt: string | null;
    /** Asset height */
    height: number | null;
    /** Asset ID */
    id: string;
    /** Is edited */
    isEdited: boolean;
    /** Is favorite */
    isFavorite: boolean;
    /** Library ID */
    libraryId: string | null;
    /** Live photo video ID */
    livePhotoVideoId: string | null;
    /** Local date time */
    localDateTime: string | null;
    /** Original file name */
    originalFileName: string;
    /** Owner ID */
    ownerId: string;
    /** Stack ID */
    stackId: string | null;
    /** Thumbhash */
    thumbhash: string | null;
    /** Asset type */
    "type": AssetTypeEnum;
    /** Asset visibility */
    visibility: AssetVisibility;
    /** Asset width */
    width: number | null;
};
export type SyncAuthUserV1 = {
    /** User avatar color */
    avatarColor: (UserAvatarColor) | null;
    /** User deleted at */
    deletedAt: string | null;
    /** User email */
    email: string;
    /** User has profile image */
    hasProfileImage: boolean;
    /** User ID */
    id: string;
    /** User is admin */
    isAdmin: boolean;
    /** User name */
    name: string;
    /** User OAuth ID */
    oauthId: string;
    /** User pin code */
    pinCode: string | null;
    /** User profile changed at */
    profileChangedAt: string;
    quotaSizeInBytes: number | null;
    quotaUsageInBytes: number;
    /** User storage label */
    storageLabel: string | null;
};
export type SyncCompleteV1 = {};
export type SyncMemoryAssetDeleteV1 = {
    /** Asset ID */
    assetId: string;
    /** Memory ID */
    memoryId: string;
};
export type SyncMemoryAssetV1 = {
    /** Asset ID */
    assetId: string;
    /** Memory ID */
    memoryId: string;
};
export type SyncMemoryDeleteV1 = {
    /** Memory ID */
    memoryId: string;
};
export type SyncMemoryV1 = {
    /** Created at */
    createdAt: string;
    /** Data */
    data: object;
    /** Deleted at */
    deletedAt: string | null;
    /** Hide at */
    hideAt: string | null;
    /** Memory ID */
    id: string;
    /** Is saved */
    isSaved: boolean;
    /** Memory at */
    memoryAt: string;
    /** Owner ID */
    ownerId: string;
    /** Seen at */
    seenAt: string | null;
    /** Show at */
    showAt: string | null;
    /** Memory type */
    "type": MemoryType;
    /** Updated at */
    updatedAt: string;
};
export type SyncPartnerDeleteV1 = {
    /** Shared by ID */
    sharedById: string;
    /** Shared with ID */
    sharedWithId: string;
};
export type SyncPartnerV1 = {
    /** In timeline */
    inTimeline: boolean;
    /** Shared by ID */
    sharedById: string;
    /** Shared with ID */
    sharedWithId: string;
};
export type SyncPersonDeleteV1 = {
    /** Person ID */
    personId: string;
};
export type SyncPersonV1 = {
    /** Birth date */
    birthDate: string | null;
    /** Color */
    color: string | null;
    /** Created at */
    createdAt: string;
    /** Face asset ID */
    faceAssetId: string | null;
    /** Person ID */
    id: string;
    /** Is favorite */
    isFavorite: boolean;
    /** Is hidden */
    isHidden: boolean;
    /** Person name */
    name: string;
    /** Owner ID */
    ownerId: string;
    /** Updated at */
    updatedAt: string;
};
export type SyncResetV1 = {};
export type SyncStackDeleteV1 = {
    /** Stack ID */
    stackId: string;
};
export type SyncStackV1 = {
    /** Created at */
    createdAt: string;
    /** Stack ID */
    id: string;
    /** Owner ID */
    ownerId: string;
    /** Primary asset ID */
    primaryAssetId: string;
    /** Updated at */
    updatedAt: string;
};
export type SyncUserDeleteV1 = {
    /** User ID */
    userId: string;
};
export type SyncUserMetadataDeleteV1 = {
    /** User metadata key */
    key: UserMetadataKey;
    /** User ID */
    userId: string;
};
export type SyncUserMetadataV1 = {
    /** User metadata key */
    key: UserMetadataKey;
    /** User ID */
    userId: string;
    /** User metadata value */
    value: object;
};
export type SyncUserV1 = {
    /** User avatar color */
    avatarColor: (UserAvatarColor) | null;
    /** User deleted at */
    deletedAt: string | null;
    /** User email */
    email: string;
    /** User has profile image */
    hasProfileImage: boolean;
    /** User ID */
    id: string;
    /** User name */
    name: string;
    /** User profile changed at */
    profileChangedAt: string;
};
/**
 * List all activities
 */
export function getActivities({ albumId, assetId, level, $type, userId }: {
    albumId: string;
    assetId?: string;
    level?: ReactionLevel;
    $type?: ReactionType;
    userId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ActivityResponseDto[];
    }>(`/activities${QS.query(QS.explode({
        albumId,
        assetId,
        level,
        "type": $type,
        userId
    }))}`, {
        ...opts
    }));
}
/**
 * Create an activity
 */
export function createActivity({ activityCreateDto }: {
    activityCreateDto: ActivityCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: ActivityResponseDto;
    }>("/activities", oazapfts.json({
        ...opts,
        method: "POST",
        body: activityCreateDto
    })));
}
/**
 * Retrieve activity statistics
 */
export function getActivityStatistics({ albumId, assetId }: {
    albumId: string;
    assetId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ActivityStatisticsResponseDto;
    }>(`/activities/statistics${QS.query(QS.explode({
        albumId,
        assetId
    }))}`, {
        ...opts
    }));
}
/**
 * Delete an activity
 */
export function deleteActivity({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/activities/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Unlink all OAuth accounts
 */
export function unlinkAllOAuthAccountsAdmin(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/auth/unlink-all", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Delete database backup
 */
export function deleteDatabaseBackup({ databaseBackupDeleteDto }: {
    databaseBackupDeleteDto: DatabaseBackupDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: databaseBackupDeleteDto
    })));
}
/**
 * List database backups
 */
export function listDatabaseBackups(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: DatabaseBackupListResponseDto;
    }>("/admin/database-backups", {
        ...opts
    }));
}
/**
 * Start database backup restore flow
 */
export function startDatabaseRestoreFlow(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups/start-restore", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Upload database backup
 */
export function uploadDatabaseBackup({ databaseBackupUploadDto }: {
    databaseBackupUploadDto: DatabaseBackupUploadDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups/upload", oazapfts.multipart({
        ...opts,
        method: "POST",
        body: databaseBackupUploadDto
    })));
}
/**
 * Download database backup
 */
export function downloadDatabaseBackup({ filename }: {
    filename: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/admin/database-backups/${encodeURIComponent(filename)}`, {
        ...opts
    }));
}
/**
 * Set maintenance mode
 */
export function setMaintenanceMode({ setMaintenanceModeDto }: {
    setMaintenanceModeDto: SetMaintenanceModeDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/maintenance", oazapfts.json({
        ...opts,
        method: "POST",
        body: setMaintenanceModeDto
    })));
}
/**
 * Detect existing install
 */
export function detectPriorInstall(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MaintenanceDetectInstallResponseDto;
    }>("/admin/maintenance/detect-install", {
        ...opts
    }));
}
/**
 * Log into maintenance mode
 */
export function maintenanceLogin({ maintenanceLoginDto }: {
    maintenanceLoginDto: MaintenanceLoginDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: MaintenanceAuthDto;
    }>("/admin/maintenance/login", oazapfts.json({
        ...opts,
        method: "POST",
        body: maintenanceLoginDto
    })));
}
/**
 * Get maintenance mode status
 */
export function getMaintenanceStatus(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MaintenanceStatusResponseDto;
    }>("/admin/maintenance/status", {
        ...opts
    }));
}
/**
 * Create a notification
 */
export function createNotification({ notificationCreateDto }: {
    notificationCreateDto: NotificationCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: NotificationDto;
    }>("/admin/notifications", oazapfts.json({
        ...opts,
        method: "POST",
        body: notificationCreateDto
    })));
}
/**
 * Render email template
 */
export function getNotificationTemplateAdmin({ name, templateDto }: {
    name: string;
    templateDto: TemplateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TemplateResponseDto;
    }>(`/admin/notifications/templates/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: templateDto
    })));
}
/**
 * Send test email
 */
export function sendTestEmailAdmin({ systemConfigSmtpDto }: {
    systemConfigSmtpDto: SystemConfigSmtpDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TestEmailResponseDto;
    }>("/admin/notifications/test-email", oazapfts.json({
        ...opts,
        method: "POST",
        body: systemConfigSmtpDto
    })));
}
/**
 * Search users
 */
export function searchUsersAdmin({ id, withDeleted }: {
    id?: string;
    withDeleted?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto[];
    }>(`/admin/users${QS.query(QS.explode({
        id,
        withDeleted
    }))}`, {
        ...opts
    }));
}
/**
 * Create a user
 */
export function createUserAdmin({ userAdminCreateDto }: {
    userAdminCreateDto: UserAdminCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserAdminResponseDto;
    }>("/admin/users", oazapfts.json({
        ...opts,
        method: "POST",
        body: userAdminCreateDto
    })));
}
/**
 * Delete a user
 */
export function deleteUserAdmin({ id, userAdminDeleteDto }: {
    id: string;
    userAdminDeleteDto: UserAdminDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: userAdminDeleteDto
    })));
}
/**
 * Retrieve a user
 */
export function getUserAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a user
 */
export function updateUserAdmin({ id, userAdminUpdateDto }: {
    id: string;
    userAdminUpdateDto: UserAdminUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: userAdminUpdateDto
    })));
}
/**
 * Retrieve user preferences
 */
export function getUserPreferencesAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserPreferencesResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}/preferences`, {
        ...opts
    }));
}
/**
 * Update user preferences
 */
export function updateUserPreferencesAdmin({ id, userPreferencesUpdateDto }: {
    id: string;
    userPreferencesUpdateDto: UserPreferencesUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserPreferencesResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}/preferences`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: userPreferencesUpdateDto
    })));
}
/**
 * Restore a deleted user
 */
export function restoreUserAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}/restore`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve user sessions
 */
export function getUserSessionsAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SessionResponseDto[];
    }>(`/admin/users/${encodeURIComponent(id)}/sessions`, {
        ...opts
    }));
}
/**
 * Retrieve user statistics
 */
export function getUserStatisticsAdmin({ id, isFavorite, isTrashed, visibility }: {
    id: string;
    isFavorite?: boolean;
    isTrashed?: boolean;
    visibility?: AssetVisibility;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetStatsResponseDto;
    }>(`/admin/users/${encodeURIComponent(id)}/statistics${QS.query(QS.explode({
        isFavorite,
        isTrashed,
        visibility
    }))}`, {
        ...opts
    }));
}
/**
 * List all albums
 */
export function getAllAlbums({ assetId, shared }: {
    assetId?: string;
    shared?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto[];
    }>(`/albums${QS.query(QS.explode({
        assetId,
        shared
    }))}`, {
        ...opts
    }));
}
/**
 * Create an album
 */
export function createAlbum({ createAlbumDto }: {
    createAlbumDto: CreateAlbumDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: AlbumResponseDto;
    }>("/albums", oazapfts.json({
        ...opts,
        method: "POST",
        body: createAlbumDto
    })));
}
/**
 * Add assets to albums
 */
export function addAssetsToAlbums({ key, slug, albumsAddAssetsDto }: {
    key?: string;
    slug?: string;
    albumsAddAssetsDto: AlbumsAddAssetsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumsAddAssetsResponseDto;
    }>(`/albums/assets${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: albumsAddAssetsDto
    })));
}
/**
 * Retrieve album statistics
 */
export function getAlbumStatistics(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumStatisticsResponseDto;
    }>("/albums/statistics", {
        ...opts
    }));
}
/**
 * Delete an album
 */
export function deleteAlbum({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve an album
 */
export function getAlbumInfo({ id, key, slug, withoutAssets }: {
    id: string;
    key?: string;
    slug?: string;
    withoutAssets?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/albums/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        slug,
        withoutAssets
    }))}`, {
        ...opts
    }));
}
/**
 * Update an album
 */
export function updateAlbumInfo({ id, updateAlbumDto }: {
    id: string;
    updateAlbumDto: UpdateAlbumDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/albums/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: updateAlbumDto
    })));
}
/**
 * Remove assets from an album
 */
export function removeAssetFromAlbum({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/albums/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Add assets to an album
 */
export function addAssetsToAlbum({ id, key, slug, bulkIdsDto }: {
    id: string;
    key?: string;
    slug?: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/albums/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Remove user from album
 */
export function removeUserFromAlbum({ id, userId }: {
    id: string;
    userId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Update user role
 */
export function updateAlbumUser({ id, userId, updateAlbumUserDto }: {
    id: string;
    userId: string;
    updateAlbumUserDto: UpdateAlbumUserDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateAlbumUserDto
    })));
}
/**
 * Share album with users
 */
export function addUsersToAlbum({ id, addUsersDto }: {
    id: string;
    addUsersDto: AddUsersDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/albums/${encodeURIComponent(id)}/users`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: addUsersDto
    })));
}
/**
 * List all API keys
 */
export function getApiKeys(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto[];
    }>("/api-keys", {
        ...opts
    }));
}
/**
 * Create an API key
 */
export function createApiKey({ apiKeyCreateDto }: {
    apiKeyCreateDto: ApiKeyCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: ApiKeyCreateResponseDto;
    }>("/api-keys", oazapfts.json({
        ...opts,
        method: "POST",
        body: apiKeyCreateDto
    })));
}
/**
 * Retrieve the current API key
 */
export function getMyApiKey(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto;
    }>("/api-keys/me", {
        ...opts
    }));
}
/**
 * Delete an API key
 */
export function deleteApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/api-keys/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve an API key
 */
export function getApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto;
    }>(`/api-keys/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update an API key
 */
export function updateApiKey({ id, apiKeyUpdateDto }: {
    id: string;
    apiKeyUpdateDto: ApiKeyUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto;
    }>(`/api-keys/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: apiKeyUpdateDto
    })));
}
/**
 * Delete assets
 */
export function deleteAssets({ assetBulkDeleteDto }: {
    assetBulkDeleteDto: AssetBulkDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetBulkDeleteDto
    })));
}
/**
 * Upload asset
 */
export function uploadAsset({ key, slug, xImmichChecksum, assetMediaCreateDto }: {
    key?: string;
    slug?: string;
    xImmichChecksum?: string;
    assetMediaCreateDto: AssetMediaCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMediaResponseDto;
    } | {
        status: 201;
        data: AssetMediaResponseDto;
    }>(`/assets${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.multipart({
        ...opts,
        method: "POST",
        body: assetMediaCreateDto,
        headers: oazapfts.mergeHeaders(opts?.headers, {
            "x-immich-checksum": xImmichChecksum
        })
    })));
}
/**
 * Update assets
 */
export function updateAssets({ assetBulkUpdateDto }: {
    assetBulkUpdateDto: AssetBulkUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetBulkUpdateDto
    })));
}
/**
 * Check bulk upload
 */
export function checkBulkUpload({ assetBulkUploadCheckDto }: {
    assetBulkUploadCheckDto: AssetBulkUploadCheckDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetBulkUploadCheckResponseDto;
    }>("/assets/bulk-upload-check", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetBulkUploadCheckDto
    })));
}
/**
 * Copy asset
 */
export function copyAsset({ assetCopyDto }: {
    assetCopyDto: AssetCopyDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/copy", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetCopyDto
    })));
}
/**
 * Retrieve assets by device ID
 */
export function getAllUserAssetsByDeviceId({ deviceId }: {
    deviceId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>(`/assets/device/${encodeURIComponent(deviceId)}`, {
        ...opts
    }));
}
/**
 * Check existing assets
 */
export function checkExistingAssets({ checkExistingAssetsDto }: {
    checkExistingAssetsDto: CheckExistingAssetsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: CheckExistingAssetsResponseDto;
    }>("/assets/exist", oazapfts.json({
        ...opts,
        method: "POST",
        body: checkExistingAssetsDto
    })));
}
/**
 * Run an asset job
 */
export function runAssetJobs({ assetJobsDto }: {
    assetJobsDto: AssetJobsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/jobs", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetJobsDto
    })));
}
/**
 * Delete asset metadata
 */
export function deleteBulkAssetMetadata({ assetMetadataBulkDeleteDto }: {
    assetMetadataBulkDeleteDto: AssetMetadataBulkDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/metadata", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetMetadataBulkDeleteDto
    })));
}
/**
 * Upsert asset metadata
 */
export function updateBulkAssetMetadata({ assetMetadataBulkUpsertDto }: {
    assetMetadataBulkUpsertDto: AssetMetadataBulkUpsertDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMetadataBulkResponseDto[];
    }>("/assets/metadata", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetMetadataBulkUpsertDto
    })));
}
/**
 * Get random assets
 */
export function getRandom({ count }: {
    count?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/assets/random${QS.query(QS.explode({
        count
    }))}`, {
        ...opts
    }));
}
/**
 * Get asset statistics
 */
export function getAssetStatistics({ isFavorite, isTrashed, visibility }: {
    isFavorite?: boolean;
    isTrashed?: boolean;
    visibility?: AssetVisibility;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetStatsResponseDto;
    }>(`/assets/statistics${QS.query(QS.explode({
        isFavorite,
        isTrashed,
        visibility
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve an asset
 */
export function getAssetInfo({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto;
    }>(`/assets/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Update an asset
 */
export function updateAsset({ id, updateAssetDto }: {
    id: string;
    updateAssetDto: UpdateAssetDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto;
    }>(`/assets/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateAssetDto
    })));
}
/**
 * Remove edits from an existing asset
 */
export function removeAssetEdits({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/edits`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve edits for an existing asset
 */
export function getAssetEdits({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetEditsResponseDto;
    }>(`/assets/${encodeURIComponent(id)}/edits`, {
        ...opts
    }));
}
/**
 * Apply edits to an existing asset
 */
export function editAsset({ id, assetEditsCreateDto }: {
    id: string;
    assetEditsCreateDto: AssetEditsCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetEditsResponseDto;
    }>(`/assets/${encodeURIComponent(id)}/edits`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetEditsCreateDto
    })));
}
/**
 * Get asset metadata
 */
export function getAssetMetadata({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMetadataResponseDto[];
    }>(`/assets/${encodeURIComponent(id)}/metadata`, {
        ...opts
    }));
}
/**
 * Update asset metadata
 */
export function updateAssetMetadata({ id, assetMetadataUpsertDto }: {
    id: string;
    assetMetadataUpsertDto: AssetMetadataUpsertDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMetadataResponseDto[];
    }>(`/assets/${encodeURIComponent(id)}/metadata`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetMetadataUpsertDto
    })));
}
/**
 * Delete asset metadata by key
 */
export function deleteAssetMetadata({ id, key }: {
    id: string;
    key: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/metadata/${encodeURIComponent(key)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve asset metadata by key
 */
export function getAssetMetadataByKey({ id, key }: {
    id: string;
    key: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMetadataResponseDto;
    }>(`/assets/${encodeURIComponent(id)}/metadata/${encodeURIComponent(key)}`, {
        ...opts
    }));
}
/**
 * Retrieve asset OCR data
 */
export function getAssetOcr({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetOcrResponseDto[];
    }>(`/assets/${encodeURIComponent(id)}/ocr`, {
        ...opts
    }));
}
/**
 * Download original asset
 */
export function downloadAsset({ edited, id, key, slug }: {
    edited?: boolean;
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
        edited,
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Replace asset
 */
export function replaceAsset({ id, key, slug, assetMediaReplaceDto }: {
    id: string;
    key?: string;
    slug?: string;
    assetMediaReplaceDto: AssetMediaReplaceDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetMediaResponseDto;
    }>(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.multipart({
        ...opts,
        method: "PUT",
        body: assetMediaReplaceDto
    })));
}
/**
 * View asset thumbnail
 */
export function viewAsset({ edited, id, key, size, slug }: {
    edited?: boolean;
    id: string;
    key?: string;
    size?: AssetMediaSize;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/thumbnail${QS.query(QS.explode({
        edited,
        key,
        size,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Play asset video
 */
export function playAssetVideo({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/video/playback${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Register admin
 */
export function signUpAdmin({ signUpDto }: {
    signUpDto: SignUpDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserAdminResponseDto;
    }>("/auth/admin-sign-up", oazapfts.json({
        ...opts,
        method: "POST",
        body: signUpDto
    })));
}
/**
 * Change password
 */
export function changePassword({ changePasswordDto }: {
    changePasswordDto: ChangePasswordDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>("/auth/change-password", oazapfts.json({
        ...opts,
        method: "POST",
        body: changePasswordDto
    })));
}
/**
 * Login
 */
export function login({ loginCredentialDto }: {
    loginCredentialDto: LoginCredentialDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: LoginResponseDto;
    }>("/auth/login", oazapfts.json({
        ...opts,
        method: "POST",
        body: loginCredentialDto
    })));
}
/**
 * Logout
 */
export function logout(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LogoutResponseDto;
    }>("/auth/logout", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Reset pin code
 */
export function resetPinCode({ pinCodeResetDto }: {
    pinCodeResetDto: PinCodeResetDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: pinCodeResetDto
    })));
}
/**
 * Setup pin code
 */
export function setupPinCode({ pinCodeSetupDto }: {
    pinCodeSetupDto: PinCodeSetupDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "POST",
        body: pinCodeSetupDto
    })));
}
/**
 * Change pin code
 */
export function changePinCode({ pinCodeChangeDto }: {
    pinCodeChangeDto: PinCodeChangeDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "PUT",
        body: pinCodeChangeDto
    })));
}
/**
 * Lock auth session
 */
export function lockAuthSession(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/session/lock", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Unlock auth session
 */
export function unlockAuthSession({ sessionUnlockDto }: {
    sessionUnlockDto: SessionUnlockDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/session/unlock", oazapfts.json({
        ...opts,
        method: "POST",
        body: sessionUnlockDto
    })));
}
/**
 * Retrieve auth status
 */
export function getAuthStatus(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AuthStatusResponseDto;
    }>("/auth/status", {
        ...opts
    }));
}
/**
 * Validate access token
 */
export function validateAccessToken(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ValidateAccessTokenResponseDto;
    }>("/auth/validateToken", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Download asset archive
 */
export function downloadArchive({ key, slug, downloadArchiveDto }: {
    key?: string;
    slug?: string;
    downloadArchiveDto: DownloadArchiveDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/download/archive${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: downloadArchiveDto
    })));
}
/**
 * Retrieve download information
 */
export function getDownloadInfo({ key, slug, downloadInfoDto }: {
    key?: string;
    slug?: string;
    downloadInfoDto: DownloadInfoDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: DownloadResponseDto;
    }>(`/download/info${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: downloadInfoDto
    })));
}
/**
 * Delete duplicates
 */
export function deleteDuplicates({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/duplicates", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Retrieve duplicates
 */
export function getAssetDuplicates(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: DuplicateResponseDto[];
    }>("/duplicates", {
        ...opts
    }));
}
/**
 * Delete a duplicate
 */
export function deleteDuplicate({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/duplicates/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve faces for asset
 */
export function getFaces({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetFaceResponseDto[];
    }>(`/faces${QS.query(QS.explode({
        id
    }))}`, {
        ...opts
    }));
}
/**
 * Create a face
 */
export function createFace({ assetFaceCreateDto }: {
    assetFaceCreateDto: AssetFaceCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/faces", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetFaceCreateDto
    })));
}
/**
 * Delete a face
 */
export function deleteFace({ id, assetFaceDeleteDto }: {
    id: string;
    assetFaceDeleteDto: AssetFaceDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/faces/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetFaceDeleteDto
    })));
}
/**
 * Re-assign a face to another person
 */
export function reassignFacesById({ id, faceDto }: {
    id: string;
    faceDto: FaceDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/faces/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: faceDto
    })));
}
/**
 * Retrieve queue counts and status
 */
export function getQueuesLegacy(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueuesResponseLegacyDto;
    }>("/jobs", {
        ...opts
    }));
}
/**
 * Create a manual job
 */
export function createJob({ jobCreateDto }: {
    jobCreateDto: JobCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/jobs", oazapfts.json({
        ...opts,
        method: "POST",
        body: jobCreateDto
    })));
}
/**
 * Run jobs
 */
export function runQueueCommandLegacy({ name, queueCommandDto }: {
    name: QueueName;
    queueCommandDto: QueueCommandDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueueResponseLegacyDto;
    }>(`/jobs/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: queueCommandDto
    })));
}
/**
 * Retrieve libraries
 */
export function getAllLibraries(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto[];
    }>("/libraries", {
        ...opts
    }));
}
/**
 * Create a library
 */
export function createLibrary({ createLibraryDto }: {
    createLibraryDto: CreateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: LibraryResponseDto;
    }>("/libraries", oazapfts.json({
        ...opts,
        method: "POST",
        body: createLibraryDto
    })));
}
/**
 * Delete a library
 */
export function deleteLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a library
 */
export function getLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto;
    }>(`/libraries/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a library
 */
export function updateLibrary({ id, updateLibraryDto }: {
    id: string;
    updateLibraryDto: UpdateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto;
    }>(`/libraries/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateLibraryDto
    })));
}
/**
 * Scan a library
 */
export function scanLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}/scan`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve library statistics
 */
export function getLibraryStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryStatsResponseDto;
    }>(`/libraries/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
/**
 * Validate library settings
 */
export function validate({ id, validateLibraryDto }: {
    id: string;
    validateLibraryDto: ValidateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ValidateLibraryResponseDto;
    }>(`/libraries/${encodeURIComponent(id)}/validate`, oazapfts.json({
        ...opts,
        method: "POST",
        body: validateLibraryDto
    })));
}
/**
 * Retrieve map markers
 */
export function getMapMarkers({ fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums }: {
    fileCreatedAfter?: string;
    fileCreatedBefore?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    withPartners?: boolean;
    withSharedAlbums?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MapMarkerResponseDto[];
    }>(`/map/markers${QS.query(QS.explode({
        fileCreatedAfter,
        fileCreatedBefore,
        isArchived,
        isFavorite,
        withPartners,
        withSharedAlbums
    }))}`, {
        ...opts
    }));
}
/**
 * Reverse geocode coordinates
 */
export function reverseGeocode({ lat, lon }: {
    lat: number;
    lon: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MapReverseGeocodeResponseDto[];
    }>(`/map/reverse-geocode${QS.query(QS.explode({
        lat,
        lon
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve memories
 */
export function searchMemories({ $for, isSaved, isTrashed, order, size, $type }: {
    $for?: string;
    isSaved?: boolean;
    isTrashed?: boolean;
    order?: MemorySearchOrder;
    size?: number;
    $type?: MemoryType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemoryResponseDto[];
    }>(`/memories${QS.query(QS.explode({
        "for": $for,
        isSaved,
        isTrashed,
        order,
        size,
        "type": $type
    }))}`, {
        ...opts
    }));
}
/**
 * Create a memory
 */
export function createMemory({ memoryCreateDto }: {
    memoryCreateDto: MemoryCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: MemoryResponseDto;
    }>("/memories", oazapfts.json({
        ...opts,
        method: "POST",
        body: memoryCreateDto
    })));
}
/**
 * Retrieve memories statistics
 */
export function memoriesStatistics({ $for, isSaved, isTrashed, order, size, $type }: {
    $for?: string;
    isSaved?: boolean;
    isTrashed?: boolean;
    order?: MemorySearchOrder;
    size?: number;
    $type?: MemoryType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemoryStatisticsResponseDto;
    }>(`/memories/statistics${QS.query(QS.explode({
        "for": $for,
        isSaved,
        isTrashed,
        order,
        size,
        "type": $type
    }))}`, {
        ...opts
    }));
}
/**
 * Delete a memory
 */
export function deleteMemory({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a memory
 */
export function getMemory({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemoryResponseDto;
    }>(`/memories/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a memory
 */
export function updateMemory({ id, memoryUpdateDto }: {
    id: string;
    memoryUpdateDto: MemoryUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemoryResponseDto;
    }>(`/memories/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: memoryUpdateDto
    })));
}
/**
 * Remove assets from a memory
 */
export function removeMemoryAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Add assets to a memory
 */
export function addMemoryAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Delete notifications
 */
export function deleteNotifications({ notificationDeleteAllDto }: {
    notificationDeleteAllDto: NotificationDeleteAllDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/notifications", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: notificationDeleteAllDto
    })));
}
/**
 * Retrieve notifications
 */
export function getNotifications({ id, level, $type, unread }: {
    id?: string;
    level?: NotificationLevel;
    $type?: NotificationType;
    unread?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: NotificationDto[];
    }>(`/notifications${QS.query(QS.explode({
        id,
        level,
        "type": $type,
        unread
    }))}`, {
        ...opts
    }));
}
/**
 * Update notifications
 */
export function updateNotifications({ notificationUpdateAllDto }: {
    notificationUpdateAllDto: NotificationUpdateAllDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/notifications", oazapfts.json({
        ...opts,
        method: "PUT",
        body: notificationUpdateAllDto
    })));
}
/**
 * Delete a notification
 */
export function deleteNotification({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/notifications/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get a notification
 */
export function getNotification({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: NotificationDto;
    }>(`/notifications/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a notification
 */
export function updateNotification({ id, notificationUpdateDto }: {
    id: string;
    notificationUpdateDto: NotificationUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: NotificationDto;
    }>(`/notifications/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: notificationUpdateDto
    })));
}
/**
 * Start OAuth
 */
export function startOAuth({ oAuthConfigDto }: {
    oAuthConfigDto: OAuthConfigDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: OAuthAuthorizeResponseDto;
    }>("/oauth/authorize", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthConfigDto
    })));
}
/**
 * Finish OAuth
 */
export function finishOAuth({ oAuthCallbackDto }: {
    oAuthCallbackDto: OAuthCallbackDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: LoginResponseDto;
    }>("/oauth/callback", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthCallbackDto
    })));
}
/**
 * Link OAuth account
 */
export function linkOAuthAccount({ oAuthCallbackDto }: {
    oAuthCallbackDto: OAuthCallbackDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>("/oauth/link", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthCallbackDto
    })));
}
/**
 * Redirect OAuth to mobile
 */
export function redirectOAuthToMobile(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/oauth/mobile-redirect", {
        ...opts
    }));
}
/**
 * Unlink OAuth account
 */
export function unlinkOAuthAccount(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>("/oauth/unlink", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve partners
 */
export function getPartners({ direction }: {
    direction: PartnerDirection;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PartnerResponseDto[];
    }>(`/partners${QS.query(QS.explode({
        direction
    }))}`, {
        ...opts
    }));
}
/**
 * Create a partner
 */
export function createPartner({ partnerCreateDto }: {
    partnerCreateDto: PartnerCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: PartnerResponseDto;
    }>("/partners", oazapfts.json({
        ...opts,
        method: "POST",
        body: partnerCreateDto
    })));
}
/**
 * Remove a partner
 */
export function removePartner({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/partners/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Create a partner
 */
export function createPartnerDeprecated({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: PartnerResponseDto;
    }>(`/partners/${encodeURIComponent(id)}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Update a partner
 */
export function updatePartner({ id, partnerUpdateDto }: {
    id: string;
    partnerUpdateDto: PartnerUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PartnerResponseDto;
    }>(`/partners/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: partnerUpdateDto
    })));
}
/**
 * Delete people
 */
export function deletePeople({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/people", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Get all people
 */
export function getAllPeople({ closestAssetId, closestPersonId, page, size, withHidden }: {
    closestAssetId?: string;
    closestPersonId?: string;
    page?: number;
    size?: number;
    withHidden?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PeopleResponseDto;
    }>(`/people${QS.query(QS.explode({
        closestAssetId,
        closestPersonId,
        page,
        size,
        withHidden
    }))}`, {
        ...opts
    }));
}
/**
 * Create a person
 */
export function createPerson({ personCreateDto }: {
    personCreateDto: PersonCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: PersonResponseDto;
    }>("/people", oazapfts.json({
        ...opts,
        method: "POST",
        body: personCreateDto
    })));
}
/**
 * Update people
 */
export function updatePeople({ peopleUpdateDto }: {
    peopleUpdateDto: PeopleUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>("/people", oazapfts.json({
        ...opts,
        method: "PUT",
        body: peopleUpdateDto
    })));
}
/**
 * Delete person
 */
export function deletePerson({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get a person
 */
export function getPerson({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/people/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update person
 */
export function updatePerson({ id, personUpdateDto }: {
    id: string;
    personUpdateDto: PersonUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/people/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: personUpdateDto
    })));
}
/**
 * Merge people
 */
export function mergePerson({ id, mergePersonDto }: {
    id: string;
    mergePersonDto: MergePersonDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/people/${encodeURIComponent(id)}/merge`, oazapfts.json({
        ...opts,
        method: "POST",
        body: mergePersonDto
    })));
}
/**
 * Reassign faces
 */
export function reassignFaces({ id, assetFaceUpdateDto }: {
    id: string;
    assetFaceUpdateDto: AssetFaceUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto[];
    }>(`/people/${encodeURIComponent(id)}/reassign`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetFaceUpdateDto
    })));
}
/**
 * Get person statistics
 */
export function getPersonStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonStatisticsResponseDto;
    }>(`/people/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
/**
 * Get person thumbnail
 */
export function getPersonThumbnail({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/people/${encodeURIComponent(id)}/thumbnail`, {
        ...opts
    }));
}
/**
 * List all plugins
 */
export function getPlugins(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PluginResponseDto[];
    }>("/plugins", {
        ...opts
    }));
}
/**
 * List all plugin triggers
 */
export function getPluginTriggers(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PluginTriggerResponseDto[];
    }>("/plugins/triggers", {
        ...opts
    }));
}
/**
 * Retrieve a plugin
 */
export function getPlugin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PluginResponseDto;
    }>(`/plugins/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * List all queues
 */
export function getQueues(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueueResponseDto[];
    }>("/queues", {
        ...opts
    }));
}
/**
 * Retrieve a queue
 */
export function getQueue({ name }: {
    name: QueueName;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueueResponseDto;
    }>(`/queues/${encodeURIComponent(name)}`, {
        ...opts
    }));
}
/**
 * Update a queue
 */
export function updateQueue({ name, queueUpdateDto }: {
    name: QueueName;
    queueUpdateDto: QueueUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueueResponseDto;
    }>(`/queues/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: queueUpdateDto
    })));
}
/**
 * Empty a queue
 */
export function emptyQueue({ name, queueDeleteDto }: {
    name: QueueName;
    queueDeleteDto: QueueDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/queues/${encodeURIComponent(name)}/jobs`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: queueDeleteDto
    })));
}
/**
 * Retrieve queue jobs
 */
export function getQueueJobs({ name, status }: {
    name: QueueName;
    status?: QueueJobStatus[];
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: QueueJobResponseDto[];
    }>(`/queues/${encodeURIComponent(name)}/jobs${QS.query(QS.explode({
        status
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve assets by city
 */
export function getAssetsByCity(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>("/search/cities", {
        ...opts
    }));
}
/**
 * Retrieve explore data
 */
export function getExploreData(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchExploreResponseDto[];
    }>("/search/explore", {
        ...opts
    }));
}
/**
 * Search large assets
 */
export function searchLargeAssets({ albumIds, city, country, createdAfter, createdBefore, deviceId, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, lensModel, libraryId, make, minFileSize, model, ocr, personIds, rating, size, state, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, $type, updatedAfter, updatedBefore, visibility, withDeleted, withExif }: {
    albumIds?: string[];
    city?: string | null;
    country?: string | null;
    createdAfter?: string;
    createdBefore?: string;
    deviceId?: string;
    isEncoded?: boolean;
    isFavorite?: boolean;
    isMotion?: boolean;
    isNotInAlbum?: boolean;
    isOffline?: boolean;
    lensModel?: string | null;
    libraryId?: string | null;
    make?: string;
    minFileSize?: number;
    model?: string | null;
    ocr?: string;
    personIds?: string[];
    rating?: number;
    size?: number;
    state?: string | null;
    tagIds?: string[] | null;
    takenAfter?: string;
    takenBefore?: string;
    trashedAfter?: string;
    trashedBefore?: string;
    $type?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    visibility?: AssetVisibility;
    withDeleted?: boolean;
    withExif?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/search/large-assets${QS.query(QS.explode({
        albumIds,
        city,
        country,
        createdAfter,
        createdBefore,
        deviceId,
        isEncoded,
        isFavorite,
        isMotion,
        isNotInAlbum,
        isOffline,
        lensModel,
        libraryId,
        make,
        minFileSize,
        model,
        ocr,
        personIds,
        rating,
        size,
        state,
        tagIds,
        takenAfter,
        takenBefore,
        trashedAfter,
        trashedBefore,
        "type": $type,
        updatedAfter,
        updatedBefore,
        visibility,
        withDeleted,
        withExif
    }))}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Search assets by metadata
 */
export function searchAssets({ metadataSearchDto }: {
    metadataSearchDto: MetadataSearchDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchResponseDto;
    }>("/search/metadata", oazapfts.json({
        ...opts,
        method: "POST",
        body: metadataSearchDto
    })));
}
/**
 * Search people
 */
export function searchPerson({ name, withHidden }: {
    name: string;
    withHidden?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto[];
    }>(`/search/person${QS.query(QS.explode({
        name,
        withHidden
    }))}`, {
        ...opts
    }));
}
/**
 * Search places
 */
export function searchPlaces({ name }: {
    name: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PlacesResponseDto[];
    }>(`/search/places${QS.query(QS.explode({
        name
    }))}`, {
        ...opts
    }));
}
/**
 * Search random assets
 */
export function searchRandom({ randomSearchDto }: {
    randomSearchDto: RandomSearchDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>("/search/random", oazapfts.json({
        ...opts,
        method: "POST",
        body: randomSearchDto
    })));
}
/**
 * Smart asset search
 */
export function searchSmart({ smartSearchDto }: {
    smartSearchDto: SmartSearchDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchResponseDto;
    }>("/search/smart", oazapfts.json({
        ...opts,
        method: "POST",
        body: smartSearchDto
    })));
}
/**
 * Search asset statistics
 */
export function searchAssetStatistics({ statisticsSearchDto }: {
    statisticsSearchDto: StatisticsSearchDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchStatisticsResponseDto;
    }>("/search/statistics", oazapfts.json({
        ...opts,
        method: "POST",
        body: statisticsSearchDto
    })));
}
/**
 * Retrieve search suggestions
 */
export function getSearchSuggestions({ country, includeNull, lensModel, make, model, state, $type }: {
    country?: string;
    includeNull?: boolean;
    lensModel?: string;
    make?: string;
    model?: string;
    state?: string;
    $type: SearchSuggestionType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>(`/search/suggestions${QS.query(QS.explode({
        country,
        includeNull,
        lensModel,
        make,
        model,
        state,
        "type": $type
    }))}`, {
        ...opts
    }));
}
/**
 * Get server information
 */
export function getAboutInfo(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerAboutResponseDto;
    }>("/server/about", {
        ...opts
    }));
}
/**
 * Get APK links
 */
export function getApkLinks(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerApkLinksDto;
    }>("/server/apk-links", {
        ...opts
    }));
}
/**
 * Get config
 */
export function getServerConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerConfigDto;
    }>("/server/config", {
        ...opts
    }));
}
/**
 * Get features
 */
export function getServerFeatures(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerFeaturesDto;
    }>("/server/features", {
        ...opts
    }));
}
/**
 * Delete server product key
 */
export function deleteServerLicense(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/license", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get product key
 */
export function getServerLicense(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LicenseResponseDto;
    } | {
        status: 404;
    }>("/server/license", {
        ...opts
    }));
}
/**
 * Set server product key
 */
export function setServerLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LicenseResponseDto;
    }>("/server/license", oazapfts.json({
        ...opts,
        method: "PUT",
        body: licenseKeyDto
    })));
}
/**
 * Get supported media types
 */
export function getSupportedMediaTypes(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerMediaTypesResponseDto;
    }>("/server/media-types", {
        ...opts
    }));
}
/**
 * Ping
 */
export function pingServer(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerPingResponseRead;
    }>("/server/ping", {
        ...opts
    }));
}
/**
 * Get statistics
 */
export function getServerStatistics(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerStatsResponseDto;
    }>("/server/statistics", {
        ...opts
    }));
}
/**
 * Get storage
 */
export function getStorage(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerStorageResponseDto;
    }>("/server/storage", {
        ...opts
    }));
}
/**
 * Get theme
 */
export function getTheme(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerThemeDto;
    }>("/server/theme", {
        ...opts
    }));
}
/**
 * Get server version
 */
export function getServerVersion(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerVersionResponseDto;
    }>("/server/version", {
        ...opts
    }));
}
/**
 * Get version check status
 */
export function getVersionCheck(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: VersionCheckStateResponseDto;
    }>("/server/version-check", {
        ...opts
    }));
}
/**
 * Get version history
 */
export function getVersionHistory(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerVersionHistoryResponseDto[];
    }>("/server/version-history", {
        ...opts
    }));
}
/**
 * Delete all sessions
 */
export function deleteAllSessions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/sessions", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve sessions
 */
export function getSessions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SessionResponseDto[];
    }>("/sessions", {
        ...opts
    }));
}
/**
 * Create a session
 */
export function createSession({ sessionCreateDto }: {
    sessionCreateDto: SessionCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: SessionCreateResponseDto;
    }>("/sessions", oazapfts.json({
        ...opts,
        method: "POST",
        body: sessionCreateDto
    })));
}
/**
 * Delete a session
 */
export function deleteSession({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/sessions/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Update a session
 */
export function updateSession({ id, sessionUpdateDto }: {
    id: string;
    sessionUpdateDto: SessionUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SessionResponseDto;
    }>(`/sessions/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: sessionUpdateDto
    })));
}
/**
 * Lock a session
 */
export function lockSession({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/sessions/${encodeURIComponent(id)}/lock`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve all shared links
 */
export function getAllSharedLinks({ albumId, id }: {
    albumId?: string;
    id?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto[];
    }>(`/shared-links${QS.query(QS.explode({
        albumId,
        id
    }))}`, {
        ...opts
    }));
}
/**
 * Create a shared link
 */
export function createSharedLink({ sharedLinkCreateDto }: {
    sharedLinkCreateDto: SharedLinkCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: SharedLinkResponseDto;
    }>("/shared-links", oazapfts.json({
        ...opts,
        method: "POST",
        body: sharedLinkCreateDto
    })));
}
/**
 * Shared link login
 */
export function sharedLinkLogin({ key, slug, sharedLinkLoginDto }: {
    key?: string;
    slug?: string;
    sharedLinkLoginDto: SharedLinkLoginDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: SharedLinkResponseDto;
    }>(`/shared-links/login${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: sharedLinkLoginDto
    })));
}
/**
 * Retrieve current shared link
 */
export function getMySharedLink({ key, password, slug, token }: {
    key?: string;
    password?: string;
    slug?: string;
    token?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-links/me${QS.query(QS.explode({
        key,
        password,
        slug,
        token
    }))}`, {
        ...opts
    }));
}
/**
 * Delete a shared link
 */
export function removeSharedLink({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a shared link
 */
export function getSharedLinkById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-links/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a shared link
 */
export function updateSharedLink({ id, sharedLinkEditDto }: {
    id: string;
    sharedLinkEditDto: SharedLinkEditDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-links/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: sharedLinkEditDto
    })));
}
/**
 * Remove assets from a shared link
 */
export function removeSharedLinkAssets({ id, key, slug, assetIdsDto }: {
    id: string;
    key?: string;
    slug?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/shared-links/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetIdsDto
    })));
}
/**
 * Add assets to a shared link
 */
export function addSharedLinkAssets({ id, key, slug, assetIdsDto }: {
    id: string;
    key?: string;
    slug?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/shared-links/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key,
        slug
    }))}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetIdsDto
    })));
}
/**
 * Delete stacks
 */
export function deleteStacks({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/stacks", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Retrieve stacks
 */
export function searchStacks({ primaryAssetId }: {
    primaryAssetId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: StackResponseDto[];
    }>(`/stacks${QS.query(QS.explode({
        primaryAssetId
    }))}`, {
        ...opts
    }));
}
/**
 * Create a stack
 */
export function createStack({ stackCreateDto }: {
    stackCreateDto: StackCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: StackResponseDto;
    }>("/stacks", oazapfts.json({
        ...opts,
        method: "POST",
        body: stackCreateDto
    })));
}
/**
 * Delete a stack
 */
export function deleteStack({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a stack
 */
export function getStack({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: StackResponseDto;
    }>(`/stacks/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a stack
 */
export function updateStack({ id, stackUpdateDto }: {
    id: string;
    stackUpdateDto: StackUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: StackResponseDto;
    }>(`/stacks/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: stackUpdateDto
    })));
}
/**
 * Remove an asset from a stack
 */
export function removeAssetFromStack({ assetId, id }: {
    assetId: string;
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}/assets/${encodeURIComponent(assetId)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Delete acknowledgements
 */
export function deleteSyncAck({ syncAckDeleteDto }: {
    syncAckDeleteDto: SyncAckDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/ack", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: syncAckDeleteDto
    })));
}
/**
 * Retrieve acknowledgements
 */
export function getSyncAck(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SyncAckDto[];
    }>("/sync/ack", {
        ...opts
    }));
}
/**
 * Acknowledge changes
 */
export function sendSyncAck({ syncAckSetDto }: {
    syncAckSetDto: SyncAckSetDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/ack", oazapfts.json({
        ...opts,
        method: "POST",
        body: syncAckSetDto
    })));
}
/**
 * Get delta sync for user
 */
export function getDeltaSync({ assetDeltaSyncDto }: {
    assetDeltaSyncDto: AssetDeltaSyncDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetDeltaSyncResponseDto;
    }>("/sync/delta-sync", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetDeltaSyncDto
    })));
}
/**
 * Get full sync for user
 */
export function getFullSyncForUser({ assetFullSyncDto }: {
    assetFullSyncDto: AssetFullSyncDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>("/sync/full-sync", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetFullSyncDto
    })));
}
/**
 * Stream sync changes
 */
export function getSyncStream({ syncStreamDto }: {
    syncStreamDto: SyncStreamDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/stream", oazapfts.json({
        ...opts,
        method: "POST",
        body: syncStreamDto
    })));
}
/**
 * Get system configuration
 */
export function getConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigDto;
    }>("/system-config", {
        ...opts
    }));
}
/**
 * Update system configuration
 */
export function updateConfig({ systemConfigDto }: {
    systemConfigDto: SystemConfigDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigDto;
    }>("/system-config", oazapfts.json({
        ...opts,
        method: "PUT",
        body: systemConfigDto
    })));
}
/**
 * Get system configuration defaults
 */
export function getConfigDefaults(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigDto;
    }>("/system-config/defaults", {
        ...opts
    }));
}
/**
 * Get storage template options
 */
export function getStorageTemplateOptions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigTemplateStorageOptionDto;
    }>("/system-config/storage-template-options", {
        ...opts
    }));
}
/**
 * Retrieve admin onboarding
 */
export function getAdminOnboarding(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AdminOnboardingUpdateDto;
    }>("/system-metadata/admin-onboarding", {
        ...opts
    }));
}
/**
 * Update admin onboarding
 */
export function updateAdminOnboarding({ adminOnboardingUpdateDto }: {
    adminOnboardingUpdateDto: AdminOnboardingUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-metadata/admin-onboarding", oazapfts.json({
        ...opts,
        method: "POST",
        body: adminOnboardingUpdateDto
    })));
}
/**
 * Retrieve reverse geocoding state
 */
export function getReverseGeocodingState(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ReverseGeocodingStateResponseDto;
    }>("/system-metadata/reverse-geocoding-state", {
        ...opts
    }));
}
/**
 * Retrieve version check state
 */
export function getVersionCheckState(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: VersionCheckStateResponseDto;
    }>("/system-metadata/version-check-state", {
        ...opts
    }));
}
/**
 * Retrieve tags
 */
export function getAllTags(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto[];
    }>("/tags", {
        ...opts
    }));
}
/**
 * Create a tag
 */
export function createTag({ tagCreateDto }: {
    tagCreateDto: TagCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: TagResponseDto;
    }>("/tags", oazapfts.json({
        ...opts,
        method: "POST",
        body: tagCreateDto
    })));
}
/**
 * Upsert tags
 */
export function upsertTags({ tagUpsertDto }: {
    tagUpsertDto: TagUpsertDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto[];
    }>("/tags", oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagUpsertDto
    })));
}
/**
 * Tag assets
 */
export function bulkTagAssets({ tagBulkAssetsDto }: {
    tagBulkAssetsDto: TagBulkAssetsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagBulkAssetsResponseDto;
    }>("/tags/assets", oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagBulkAssetsDto
    })));
}
/**
 * Delete a tag
 */
export function deleteTag({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a tag
 */
export function getTagById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto;
    }>(`/tags/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a tag
 */
export function updateTag({ id, tagUpdateDto }: {
    id: string;
    tagUpdateDto: TagUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto;
    }>(`/tags/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagUpdateDto
    })));
}
/**
 * Untag assets
 */
export function untagAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Tag assets
 */
export function tagAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Get time bucket
 */
export function getTimeBucket({ albumId, isFavorite, isTrashed, key, order, personId, slug, tagId, timeBucket, userId, visibility, withCoordinates, withPartners, withStacked }: {
    albumId?: string;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    order?: AssetOrder;
    personId?: string;
    slug?: string;
    tagId?: string;
    timeBucket: string;
    userId?: string;
    visibility?: AssetVisibility;
    withCoordinates?: boolean;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TimeBucketAssetResponseDto;
    }>(`/timeline/bucket${QS.query(QS.explode({
        albumId,
        isFavorite,
        isTrashed,
        key,
        order,
        personId,
        slug,
        tagId,
        timeBucket,
        userId,
        visibility,
        withCoordinates,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
/**
 * Get time buckets
 */
export function getTimeBuckets({ albumId, isFavorite, isTrashed, key, order, personId, slug, tagId, userId, visibility, withCoordinates, withPartners, withStacked }: {
    albumId?: string;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    order?: AssetOrder;
    personId?: string;
    slug?: string;
    tagId?: string;
    userId?: string;
    visibility?: AssetVisibility;
    withCoordinates?: boolean;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TimeBucketsResponseDto[];
    }>(`/timeline/buckets${QS.query(QS.explode({
        albumId,
        isFavorite,
        isTrashed,
        key,
        order,
        personId,
        slug,
        tagId,
        userId,
        visibility,
        withCoordinates,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
/**
 * Empty trash
 */
export function emptyTrash(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TrashResponseDto;
    }>("/trash/empty", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Restore trash
 */
export function restoreTrash(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TrashResponseDto;
    }>("/trash/restore", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Restore assets
 */
export function restoreAssets({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TrashResponseDto;
    }>("/trash/restore/assets", oazapfts.json({
        ...opts,
        method: "POST",
        body: bulkIdsDto
    })));
}
/**
 * Get all users
 */
export function searchUsers(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto[];
    }>("/users", {
        ...opts
    }));
}
/**
 * Get current user
 */
export function getMyUser(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>("/users/me", {
        ...opts
    }));
}
/**
 * Update current user
 */
export function updateMyUser({ userUpdateMeDto }: {
    userUpdateMeDto: UserUpdateMeDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserAdminResponseDto;
    }>("/users/me", oazapfts.json({
        ...opts,
        method: "PUT",
        body: userUpdateMeDto
    })));
}
/**
 * Delete user product key
 */
export function deleteUserLicense(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/license", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve user product key
 */
export function getUserLicense(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LicenseResponseDto;
    }>("/users/me/license", {
        ...opts
    }));
}
/**
 * Set user product key
 */
export function setUserLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LicenseResponseDto;
    }>("/users/me/license", oazapfts.json({
        ...opts,
        method: "PUT",
        body: licenseKeyDto
    })));
}
/**
 * Delete user onboarding
 */
export function deleteUserOnboarding(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/onboarding", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve user onboarding
 */
export function getUserOnboarding(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: OnboardingResponseDto;
    }>("/users/me/onboarding", {
        ...opts
    }));
}
/**
 * Update user onboarding
 */
export function setUserOnboarding({ onboardingDto }: {
    onboardingDto: OnboardingDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: OnboardingResponseDto;
    }>("/users/me/onboarding", oazapfts.json({
        ...opts,
        method: "PUT",
        body: onboardingDto
    })));
}
/**
 * Get my preferences
 */
export function getMyPreferences(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserPreferencesResponseDto;
    }>("/users/me/preferences", {
        ...opts
    }));
}
/**
 * Update my preferences
 */
export function updateMyPreferences({ userPreferencesUpdateDto }: {
    userPreferencesUpdateDto: UserPreferencesUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserPreferencesResponseDto;
    }>("/users/me/preferences", oazapfts.json({
        ...opts,
        method: "PUT",
        body: userPreferencesUpdateDto
    })));
}
/**
 * Delete user profile image
 */
export function deleteProfileImage(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/profile-image", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Create user profile image
 */
export function createProfileImage({ createProfileImageDto }: {
    createProfileImageDto: CreateProfileImageDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: CreateProfileImageResponseDto;
    }>("/users/profile-image", oazapfts.multipart({
        ...opts,
        method: "POST",
        body: createProfileImageDto
    })));
}
/**
 * Retrieve a user
 */
export function getUser({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>(`/users/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Retrieve user profile image
 */
export function getProfileImage({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/users/${encodeURIComponent(id)}/profile-image`, {
        ...opts
    }));
}
/**
 * Retrieve assets by original path
 */
export function getAssetsByOriginalPath({ path }: {
    path: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/view/folder${QS.query(QS.explode({
        path
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve unique paths
 */
export function getUniqueOriginalPaths(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>("/view/folder/unique-paths", {
        ...opts
    }));
}
/**
 * List all workflows
 */
export function getWorkflows(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: WorkflowResponseDto[];
    }>("/workflows", {
        ...opts
    }));
}
/**
 * Create a workflow
 */
export function createWorkflow({ workflowCreateDto }: {
    workflowCreateDto: WorkflowCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: WorkflowResponseDto;
    }>("/workflows", oazapfts.json({
        ...opts,
        method: "POST",
        body: workflowCreateDto
    })));
}
/**
 * Delete a workflow
 */
export function deleteWorkflow({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/workflows/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a workflow
 */
export function getWorkflow({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: WorkflowResponseDto;
    }>(`/workflows/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a workflow
 */
export function updateWorkflow({ id, workflowUpdateDto }: {
    id: string;
    workflowUpdateDto: WorkflowUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: WorkflowResponseDto;
    }>(`/workflows/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: workflowUpdateDto
    })));
}
export enum ReactionLevel {
    Album = "album",
    Asset = "asset"
}
export enum ReactionType {
    Comment = "comment",
    Like = "like"
}
export enum UserAvatarColor {
    Primary = "primary",
    Pink = "pink",
    Red = "red",
    Yellow = "yellow",
    Blue = "blue",
    Green = "green",
    Purple = "purple",
    Orange = "orange",
    Gray = "gray",
    Amber = "amber"
}
export enum MaintenanceAction {
    Start = "start",
    End = "end",
    SelectDatabaseRestore = "select_database_restore",
    RestoreDatabase = "restore_database"
}
export enum StorageFolder {
    EncodedVideo = "encoded-video",
    Library = "library",
    Upload = "upload",
    Profile = "profile",
    Thumbs = "thumbs",
    Backups = "backups"
}
export enum NotificationLevel {
    Success = "success",
    Error = "error",
    Warning = "warning",
    Info = "info"
}
export enum NotificationType {
    JobFailed = "JobFailed",
    BackupFailed = "BackupFailed",
    SystemMessage = "SystemMessage",
    AlbumInvite = "AlbumInvite",
    AlbumUpdate = "AlbumUpdate",
    Custom = "Custom"
}
export enum UserStatus {
    Active = "active",
    Removing = "removing",
    Deleted = "deleted"
}
export enum AssetOrder {
    Asc = "asc",
    Desc = "desc"
}
export enum AssetVisibility {
    Archive = "archive",
    Timeline = "timeline",
    Hidden = "hidden",
    Locked = "locked"
}
export enum AlbumUserRole {
    Editor = "editor",
    Viewer = "viewer"
}
export enum SourceType {
    MachineLearning = "machine-learning",
    Exif = "exif",
    Manual = "manual"
}
export enum AssetTypeEnum {
    Image = "IMAGE",
    Video = "VIDEO",
    Audio = "AUDIO",
    Other = "OTHER"
}
export enum BulkIdErrorReason {
    Duplicate = "duplicate",
    NoPermission = "no_permission",
    NotFound = "not_found",
    Unknown = "unknown"
}
export enum Error {
    Duplicate = "duplicate",
    NoPermission = "no_permission",
    NotFound = "not_found",
    Unknown = "unknown"
}
export enum Permission {
    All = "all",
    ActivityCreate = "activity.create",
    ActivityRead = "activity.read",
    ActivityUpdate = "activity.update",
    ActivityDelete = "activity.delete",
    ActivityStatistics = "activity.statistics",
    ApiKeyCreate = "apiKey.create",
    ApiKeyRead = "apiKey.read",
    ApiKeyUpdate = "apiKey.update",
    ApiKeyDelete = "apiKey.delete",
    AssetRead = "asset.read",
    AssetUpdate = "asset.update",
    AssetDelete = "asset.delete",
    AssetStatistics = "asset.statistics",
    AssetShare = "asset.share",
    AssetView = "asset.view",
    AssetDownload = "asset.download",
    AssetUpload = "asset.upload",
    AssetReplace = "asset.replace",
    AssetCopy = "asset.copy",
    AssetDerive = "asset.derive",
    AssetEditGet = "asset.edit.get",
    AssetEditCreate = "asset.edit.create",
    AssetEditDelete = "asset.edit.delete",
    AlbumCreate = "album.create",
    AlbumRead = "album.read",
    AlbumUpdate = "album.update",
    AlbumDelete = "album.delete",
    AlbumStatistics = "album.statistics",
    AlbumShare = "album.share",
    AlbumDownload = "album.download",
    AlbumAssetCreate = "albumAsset.create",
    AlbumAssetDelete = "albumAsset.delete",
    AlbumUserCreate = "albumUser.create",
    AlbumUserUpdate = "albumUser.update",
    AlbumUserDelete = "albumUser.delete",
    AuthChangePassword = "auth.changePassword",
    AuthDeviceDelete = "authDevice.delete",
    ArchiveRead = "archive.read",
    BackupList = "backup.list",
    BackupDownload = "backup.download",
    BackupUpload = "backup.upload",
    BackupDelete = "backup.delete",
    DuplicateRead = "duplicate.read",
    DuplicateDelete = "duplicate.delete",
    FaceCreate = "face.create",
    FaceRead = "face.read",
    FaceUpdate = "face.update",
    FaceDelete = "face.delete",
    FolderRead = "folder.read",
    JobCreate = "job.create",
    JobRead = "job.read",
    LibraryCreate = "library.create",
    LibraryRead = "library.read",
    LibraryUpdate = "library.update",
    LibraryDelete = "library.delete",
    LibraryStatistics = "library.statistics",
    TimelineRead = "timeline.read",
    TimelineDownload = "timeline.download",
    Maintenance = "maintenance",
    MapRead = "map.read",
    MapSearch = "map.search",
    MemoryCreate = "memory.create",
    MemoryRead = "memory.read",
    MemoryUpdate = "memory.update",
    MemoryDelete = "memory.delete",
    MemoryStatistics = "memory.statistics",
    MemoryAssetCreate = "memoryAsset.create",
    MemoryAssetDelete = "memoryAsset.delete",
    NotificationCreate = "notification.create",
    NotificationRead = "notification.read",
    NotificationUpdate = "notification.update",
    NotificationDelete = "notification.delete",
    PartnerCreate = "partner.create",
    PartnerRead = "partner.read",
    PartnerUpdate = "partner.update",
    PartnerDelete = "partner.delete",
    PersonCreate = "person.create",
    PersonRead = "person.read",
    PersonUpdate = "person.update",
    PersonDelete = "person.delete",
    PersonStatistics = "person.statistics",
    PersonMerge = "person.merge",
    PersonReassign = "person.reassign",
    PinCodeCreate = "pinCode.create",
    PinCodeUpdate = "pinCode.update",
    PinCodeDelete = "pinCode.delete",
    PluginCreate = "plugin.create",
    PluginRead = "plugin.read",
    PluginUpdate = "plugin.update",
    PluginDelete = "plugin.delete",
    ServerAbout = "server.about",
    ServerApkLinks = "server.apkLinks",
    ServerStorage = "server.storage",
    ServerStatistics = "server.statistics",
    ServerVersionCheck = "server.versionCheck",
    ServerLicenseRead = "serverLicense.read",
    ServerLicenseUpdate = "serverLicense.update",
    ServerLicenseDelete = "serverLicense.delete",
    SessionCreate = "session.create",
    SessionRead = "session.read",
    SessionUpdate = "session.update",
    SessionDelete = "session.delete",
    SessionLock = "session.lock",
    SharedLinkCreate = "sharedLink.create",
    SharedLinkRead = "sharedLink.read",
    SharedLinkUpdate = "sharedLink.update",
    SharedLinkDelete = "sharedLink.delete",
    StackCreate = "stack.create",
    StackRead = "stack.read",
    StackUpdate = "stack.update",
    StackDelete = "stack.delete",
    SyncStream = "sync.stream",
    SyncCheckpointRead = "syncCheckpoint.read",
    SyncCheckpointUpdate = "syncCheckpoint.update",
    SyncCheckpointDelete = "syncCheckpoint.delete",
    SystemConfigRead = "systemConfig.read",
    SystemConfigUpdate = "systemConfig.update",
    SystemMetadataRead = "systemMetadata.read",
    SystemMetadataUpdate = "systemMetadata.update",
    TagCreate = "tag.create",
    TagRead = "tag.read",
    TagUpdate = "tag.update",
    TagDelete = "tag.delete",
    TagAsset = "tag.asset",
    UserRead = "user.read",
    UserUpdate = "user.update",
    UserLicenseCreate = "userLicense.create",
    UserLicenseRead = "userLicense.read",
    UserLicenseUpdate = "userLicense.update",
    UserLicenseDelete = "userLicense.delete",
    UserOnboardingRead = "userOnboarding.read",
    UserOnboardingUpdate = "userOnboarding.update",
    UserOnboardingDelete = "userOnboarding.delete",
    UserPreferenceRead = "userPreference.read",
    UserPreferenceUpdate = "userPreference.update",
    UserProfileImageCreate = "userProfileImage.create",
    UserProfileImageRead = "userProfileImage.read",
    UserProfileImageUpdate = "userProfileImage.update",
    UserProfileImageDelete = "userProfileImage.delete",
    QueueRead = "queue.read",
    QueueUpdate = "queue.update",
    QueueJobCreate = "queueJob.create",
    QueueJobRead = "queueJob.read",
    QueueJobUpdate = "queueJob.update",
    QueueJobDelete = "queueJob.delete",
    WorkflowCreate = "workflow.create",
    WorkflowRead = "workflow.read",
    WorkflowUpdate = "workflow.update",
    WorkflowDelete = "workflow.delete",
    AdminUserCreate = "adminUser.create",
    AdminUserRead = "adminUser.read",
    AdminUserUpdate = "adminUser.update",
    AdminUserDelete = "adminUser.delete",
    AdminSessionRead = "adminSession.read",
    AdminAuthUnlinkAll = "adminAuth.unlinkAll"
}
export enum AssetMediaStatus {
    Created = "created",
    Replaced = "replaced",
    Duplicate = "duplicate"
}
export enum Action {
    Accept = "accept",
    Reject = "reject"
}
export enum Reason {
    Duplicate = "duplicate",
    UnsupportedFormat = "unsupported-format"
}
export enum AssetJobName {
    RefreshFaces = "refresh-faces",
    RefreshMetadata = "refresh-metadata",
    RegenerateThumbnail = "regenerate-thumbnail",
    TranscodeVideo = "transcode-video"
}
export enum AssetEditAction {
    Crop = "crop",
    Rotate = "rotate",
    Mirror = "mirror"
}
export enum MirrorAxis {
    Horizontal = "horizontal",
    Vertical = "vertical"
}
export enum AssetMediaSize {
    Original = "original",
    Fullsize = "fullsize",
    Preview = "preview",
    Thumbnail = "thumbnail"
}
export enum ManualJobName {
    PersonCleanup = "person-cleanup",
    TagCleanup = "tag-cleanup",
    UserCleanup = "user-cleanup",
    MemoryCleanup = "memory-cleanup",
    MemoryCreate = "memory-create",
    BackupDatabase = "backup-database"
}
export enum QueueName {
    ThumbnailGeneration = "thumbnailGeneration",
    MetadataExtraction = "metadataExtraction",
    VideoConversion = "videoConversion",
    FaceDetection = "faceDetection",
    FacialRecognition = "facialRecognition",
    SmartSearch = "smartSearch",
    DuplicateDetection = "duplicateDetection",
    BackgroundTask = "backgroundTask",
    StorageTemplateMigration = "storageTemplateMigration",
    Migration = "migration",
    Search = "search",
    Sidecar = "sidecar",
    Library = "library",
    Notifications = "notifications",
    BackupDatabase = "backupDatabase",
    Ocr = "ocr",
    Workflow = "workflow",
    Editor = "editor"
}
export enum QueueCommand {
    Start = "start",
    Pause = "pause",
    Resume = "resume",
    Empty = "empty",
    ClearFailed = "clear-failed"
}
export enum MemorySearchOrder {
    Asc = "asc",
    Desc = "desc",
    Random = "random"
}
export enum MemoryType {
    OnThisDay = "on_this_day"
}
export enum PartnerDirection {
    SharedBy = "shared-by",
    SharedWith = "shared-with"
}
export enum PluginContextType {
    Asset = "asset",
    Album = "album",
    Person = "person"
}
export enum PluginTriggerType {
    AssetCreate = "AssetCreate",
    PersonRecognized = "PersonRecognized"
}
export enum QueueJobStatus {
    Active = "active",
    Failed = "failed",
    Completed = "completed",
    Delayed = "delayed",
    Waiting = "waiting",
    Paused = "paused"
}
export enum JobName {
    AssetDelete = "AssetDelete",
    AssetDeleteCheck = "AssetDeleteCheck",
    AssetDetectFacesQueueAll = "AssetDetectFacesQueueAll",
    AssetDetectFaces = "AssetDetectFaces",
    AssetDetectDuplicatesQueueAll = "AssetDetectDuplicatesQueueAll",
    AssetDetectDuplicates = "AssetDetectDuplicates",
    AssetEditThumbnailGeneration = "AssetEditThumbnailGeneration",
    AssetEncodeVideoQueueAll = "AssetEncodeVideoQueueAll",
    AssetEncodeVideo = "AssetEncodeVideo",
    AssetEmptyTrash = "AssetEmptyTrash",
    AssetExtractMetadataQueueAll = "AssetExtractMetadataQueueAll",
    AssetExtractMetadata = "AssetExtractMetadata",
    AssetFileMigration = "AssetFileMigration",
    AssetGenerateThumbnailsQueueAll = "AssetGenerateThumbnailsQueueAll",
    AssetGenerateThumbnails = "AssetGenerateThumbnails",
    AuditLogCleanup = "AuditLogCleanup",
    AuditTableCleanup = "AuditTableCleanup",
    DatabaseBackup = "DatabaseBackup",
    FacialRecognitionQueueAll = "FacialRecognitionQueueAll",
    FacialRecognition = "FacialRecognition",
    FileDelete = "FileDelete",
    FileMigrationQueueAll = "FileMigrationQueueAll",
    LibraryDeleteCheck = "LibraryDeleteCheck",
    LibraryDelete = "LibraryDelete",
    LibraryRemoveAsset = "LibraryRemoveAsset",
    LibraryScanAssetsQueueAll = "LibraryScanAssetsQueueAll",
    LibrarySyncAssets = "LibrarySyncAssets",
    LibrarySyncFilesQueueAll = "LibrarySyncFilesQueueAll",
    LibrarySyncFiles = "LibrarySyncFiles",
    LibraryScanQueueAll = "LibraryScanQueueAll",
    MemoryCleanup = "MemoryCleanup",
    MemoryGenerate = "MemoryGenerate",
    NotificationsCleanup = "NotificationsCleanup",
    NotifyUserSignup = "NotifyUserSignup",
    NotifyAlbumInvite = "NotifyAlbumInvite",
    NotifyAlbumUpdate = "NotifyAlbumUpdate",
    UserDelete = "UserDelete",
    UserDeleteCheck = "UserDeleteCheck",
    UserSyncUsage = "UserSyncUsage",
    PersonCleanup = "PersonCleanup",
    PersonFileMigration = "PersonFileMigration",
    PersonGenerateThumbnail = "PersonGenerateThumbnail",
    SessionCleanup = "SessionCleanup",
    SendMail = "SendMail",
    SidecarQueueAll = "SidecarQueueAll",
    SidecarCheck = "SidecarCheck",
    SidecarWrite = "SidecarWrite",
    SmartSearchQueueAll = "SmartSearchQueueAll",
    SmartSearch = "SmartSearch",
    StorageTemplateMigration = "StorageTemplateMigration",
    StorageTemplateMigrationSingle = "StorageTemplateMigrationSingle",
    TagCleanup = "TagCleanup",
    VersionCheck = "VersionCheck",
    OcrQueueAll = "OcrQueueAll",
    Ocr = "Ocr",
    WorkflowRun = "WorkflowRun"
}
export enum SearchSuggestionType {
    Country = "country",
    State = "state",
    City = "city",
    CameraMake = "camera-make",
    CameraModel = "camera-model",
    CameraLensModel = "camera-lens-model"
}
export enum SharedLinkType {
    Album = "ALBUM",
    Individual = "INDIVIDUAL"
}
export enum Error2 {
    Duplicate = "duplicate",
    NoPermission = "no_permission",
    NotFound = "not_found"
}
export enum SyncEntityType {
    AuthUserV1 = "AuthUserV1",
    UserV1 = "UserV1",
    UserDeleteV1 = "UserDeleteV1",
    AssetV1 = "AssetV1",
    AssetDeleteV1 = "AssetDeleteV1",
    AssetExifV1 = "AssetExifV1",
    AssetMetadataV1 = "AssetMetadataV1",
    AssetMetadataDeleteV1 = "AssetMetadataDeleteV1",
    PartnerV1 = "PartnerV1",
    PartnerDeleteV1 = "PartnerDeleteV1",
    PartnerAssetV1 = "PartnerAssetV1",
    PartnerAssetBackfillV1 = "PartnerAssetBackfillV1",
    PartnerAssetDeleteV1 = "PartnerAssetDeleteV1",
    PartnerAssetExifV1 = "PartnerAssetExifV1",
    PartnerAssetExifBackfillV1 = "PartnerAssetExifBackfillV1",
    PartnerStackBackfillV1 = "PartnerStackBackfillV1",
    PartnerStackDeleteV1 = "PartnerStackDeleteV1",
    PartnerStackV1 = "PartnerStackV1",
    AlbumV1 = "AlbumV1",
    AlbumDeleteV1 = "AlbumDeleteV1",
    AlbumUserV1 = "AlbumUserV1",
    AlbumUserBackfillV1 = "AlbumUserBackfillV1",
    AlbumUserDeleteV1 = "AlbumUserDeleteV1",
    AlbumAssetCreateV1 = "AlbumAssetCreateV1",
    AlbumAssetUpdateV1 = "AlbumAssetUpdateV1",
    AlbumAssetBackfillV1 = "AlbumAssetBackfillV1",
    AlbumAssetExifCreateV1 = "AlbumAssetExifCreateV1",
    AlbumAssetExifUpdateV1 = "AlbumAssetExifUpdateV1",
    AlbumAssetExifBackfillV1 = "AlbumAssetExifBackfillV1",
    AlbumToAssetV1 = "AlbumToAssetV1",
    AlbumToAssetDeleteV1 = "AlbumToAssetDeleteV1",
    AlbumToAssetBackfillV1 = "AlbumToAssetBackfillV1",
    MemoryV1 = "MemoryV1",
    MemoryDeleteV1 = "MemoryDeleteV1",
    MemoryToAssetV1 = "MemoryToAssetV1",
    MemoryToAssetDeleteV1 = "MemoryToAssetDeleteV1",
    StackV1 = "StackV1",
    StackDeleteV1 = "StackDeleteV1",
    PersonV1 = "PersonV1",
    PersonDeleteV1 = "PersonDeleteV1",
    AssetFaceV1 = "AssetFaceV1",
    AssetFaceV2 = "AssetFaceV2",
    AssetFaceDeleteV1 = "AssetFaceDeleteV1",
    UserMetadataV1 = "UserMetadataV1",
    UserMetadataDeleteV1 = "UserMetadataDeleteV1",
    SyncAckV1 = "SyncAckV1",
    SyncResetV1 = "SyncResetV1",
    SyncCompleteV1 = "SyncCompleteV1"
}
export enum SyncRequestType {
    AlbumsV1 = "AlbumsV1",
    AlbumUsersV1 = "AlbumUsersV1",
    AlbumToAssetsV1 = "AlbumToAssetsV1",
    AlbumAssetsV1 = "AlbumAssetsV1",
    AlbumAssetExifsV1 = "AlbumAssetExifsV1",
    AssetsV1 = "AssetsV1",
    AssetExifsV1 = "AssetExifsV1",
    AssetMetadataV1 = "AssetMetadataV1",
    AuthUsersV1 = "AuthUsersV1",
    MemoriesV1 = "MemoriesV1",
    MemoryToAssetsV1 = "MemoryToAssetsV1",
    PartnersV1 = "PartnersV1",
    PartnerAssetsV1 = "PartnerAssetsV1",
    PartnerAssetExifsV1 = "PartnerAssetExifsV1",
    PartnerStacksV1 = "PartnerStacksV1",
    StacksV1 = "StacksV1",
    UsersV1 = "UsersV1",
    PeopleV1 = "PeopleV1",
    AssetFacesV1 = "AssetFacesV1",
    AssetFacesV2 = "AssetFacesV2",
    UserMetadataV1 = "UserMetadataV1"
}
export enum TranscodeHWAccel {
    Nvenc = "nvenc",
    Qsv = "qsv",
    Vaapi = "vaapi",
    Rkmpp = "rkmpp",
    Disabled = "disabled"
}
export enum AudioCodec {
    Mp3 = "mp3",
    Aac = "aac",
    Libopus = "libopus",
    PcmS16Le = "pcm_s16le"
}
export enum VideoContainer {
    Mov = "mov",
    Mp4 = "mp4",
    Ogg = "ogg",
    Webm = "webm"
}
export enum VideoCodec {
    H264 = "h264",
    Hevc = "hevc",
    Vp9 = "vp9",
    Av1 = "av1"
}
export enum CQMode {
    Auto = "auto",
    Cqp = "cqp",
    Icq = "icq"
}
export enum ToneMapping {
    Hable = "hable",
    Mobius = "mobius",
    Reinhard = "reinhard",
    Disabled = "disabled"
}
export enum TranscodePolicy {
    All = "all",
    Optimal = "optimal",
    Bitrate = "bitrate",
    Required = "required",
    Disabled = "disabled"
}
export enum Colorspace {
    Srgb = "srgb",
    P3 = "p3"
}
export enum ImageFormat {
    Jpeg = "jpeg",
    Webp = "webp"
}
export enum LogLevel {
    Verbose = "verbose",
    Debug = "debug",
    Log = "log",
    Warn = "warn",
    Error = "error",
    Fatal = "fatal"
}
export enum OAuthTokenEndpointAuthMethod {
    ClientSecretPost = "client_secret_post",
    ClientSecretBasic = "client_secret_basic"
}
export enum UserMetadataKey {
    Preferences = "preferences",
    License = "license",
    Onboarding = "onboarding"
}
