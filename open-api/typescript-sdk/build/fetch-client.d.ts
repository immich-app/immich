/**
 * Immich
 * 2.7.5
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
export declare const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders>;
export declare const servers: {
    server1: string;
};
export type UserResponseDto = {
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
    "type": ReactionType;
};
export type ActivityStatisticsResponseDto = {
    /** Number of comments */
    comments: number;
    /** Number of likes */
    likes: number;
};
export type DatabaseBackupDeleteDto = {
    /** Backup filenames to delete */
    backups: string[];
};
export type DatabaseBackupDto = {
    /** Backup filename */
    filename: string;
    /** Backup file size */
    filesize: number;
    /** Backup timezone */
    timezone: string;
};
export type DatabaseBackupListResponseDto = {
    /** List of backups */
    backups: DatabaseBackupDto[];
};
export type DatabaseBackupUploadDto = {
    /** Database backup file */
    file?: Blob;
};
export type SetMaintenanceModeDto = {
    action: MaintenanceAction;
    /** Restore backup filename */
    restoreBackupFilename?: string;
};
export type MaintenanceDetectInstallStorageFolderDto = {
    /** Number of files in the folder */
    files: number;
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
    action: MaintenanceAction;
    active: boolean;
    error?: string;
    progress?: number;
    task?: string;
};
export type NotificationCreateDto = {
    /** Additional notification data */
    data?: {
        [key: string]: any;
    };
    /** Notification description */
    description?: string | null;
    level?: NotificationLevel;
    /** Date when notification was read */
    readAt?: string | null;
    /** Notification title */
    title: string;
    "type"?: NotificationType;
    /** User ID to send notification to */
    userId: string;
};
export type NotificationDto = {
    /** Creation date */
    createdAt: string;
    /** Additional notification data */
    data?: {
        [key: string]: any;
    };
    /** Notification description */
    description?: string;
    /** Notification ID */
    id: string;
    level: NotificationLevel;
    /** Date when notification was read */
    readAt?: string;
    /** Notification title */
    title: string;
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
    /** License key (format: /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/) */
    licenseKey: string;
};
export type UserAdminResponseDto = {
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
    status: UserStatus;
    /** Storage label */
    storageLabel: string | null;
    /** Last update date */
    updatedAt: string;
};
export type UserAdminCreateDto = {
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
    defaultAssetOrder?: AssetOrder;
};
export type AvatarUpdate = {
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
    role: AlbumUserRole;
    user: UserResponseDto;
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
    /** First entry is always the album owner. Second entry is the auth user, if it differs from the owner. The rest are ordered alphabetically. */
    albumUsers: AlbumUserResponseDto[];
    /** Number of assets */
    assetCount: number;
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
    order?: AssetOrder;
    /** Is shared album */
    shared: boolean;
    /** Start date (earliest asset) */
    startDate?: string;
    /** Last update date */
    updatedAt: string;
};
export type AlbumUserCreateDto = {
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
    order?: AssetOrder;
};
export type BulkIdsDto = {
    /** IDs to process */
    ids: string[];
};
export type BulkIdResponseDto = {
    error?: BulkIdErrorReason;
    errorMessage?: string;
    /** ID */
    id: string;
    /** Whether operation succeeded */
    success: boolean;
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
export type UpdateAlbumUserDto = {
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
    value: {
        [key: string]: any;
    };
};
export type AssetMediaCreateDto = {
    /** Asset file data */
    assetData: Blob;
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
    visibility?: AssetVisibility;
};
export type AssetMediaResponseDto = {
    /** Asset media ID */
    id: string;
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
    /** Rating in range [1-5], or null for unrated */
    rating?: number | null;
    /** Time zone (IANA timezone) */
    timeZone?: string;
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
    action: AssetUploadAction;
    /** Existing asset ID if duplicate */
    assetId?: string;
    /** Asset ID */
    id: string;
    /** Whether existing asset is trashed */
    isTrashed?: boolean;
    reason?: AssetRejectReason;
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
export type AssetJobsDto = {
    /** Asset IDs */
    assetIds: string[];
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
    value: {
        [key: string]: any;
    };
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
    value: {
        [key: string]: any;
    };
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
    sourceType?: SourceType;
};
export type PersonWithFacesResponseDto = {
    /** Person date of birth */
    birthDate: string | null;
    /** Person color (hex) */
    color?: string;
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
    /** Duplicate group ID */
    duplicateId?: string | null;
    /** Video/gif duration in hh:mm:ss.SSS format (null for static images) */
    duration: string | null;
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
    "type": AssetTypeEnum;
    unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
    /** The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified. */
    updatedAt: string;
    visibility: AssetVisibility;
    /** Asset width */
    width: number | null;
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
    /** Rating in range [1-5], or null for unrated */
    rating?: number | null;
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
    axis: MirrorAxis;
};
export type AssetEditActionItemResponseDto = {
    action: AssetEditAction;
    /** Asset edit ID */
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
    value: {
        [key: string]: any;
    };
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
    /** Suggested asset IDs to keep based on file size and EXIF data */
    suggestedKeepAssetIds: string[];
};
export type DuplicateResolveGroupDto = {
    duplicateId: string;
    /** Asset IDs to keep */
    keepAssetIds: string[];
    /** Asset IDs to trash or delete */
    trashAssetIds: string[];
};
export type DuplicateResolveDto = {
    /** List of duplicate groups to resolve */
    groups: DuplicateResolveGroupDto[];
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
    person: (PersonResponseDto) | null;
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
    name: ManualJobName;
};
export type QueueCommandDto = {
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
export type OAuthBackchannelLogoutDto = {
    /** OAuth logout token */
    logout_token: string;
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
export type PluginJsonSchemaProperty = {
    additionalProperties?: boolean | PluginJsonSchemaProperty;
    "default"?: any;
    description?: string;
    "enum"?: string[];
    items?: PluginJsonSchemaProperty;
    properties?: {
        [key: string]: PluginJsonSchemaProperty;
    };
    required?: string[];
    "type"?: PluginJsonSchemaType;
};
export type PluginJsonSchema = {
    additionalProperties?: boolean;
    description?: string;
    properties?: {
        [key: string]: PluginJsonSchemaProperty;
    };
    required?: string[];
    "type"?: PluginJsonSchemaType;
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
    schema: (PluginJsonSchema) | null;
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
    schema: (PluginJsonSchema) | null;
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
    contextType: PluginContextType;
    "type": PluginTriggerType;
};
export type QueueResponseDto = {
    /** Whether the queue is paused */
    isPaused: boolean;
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
    data: {
        [key: string]: any;
    };
    /** Job ID */
    id?: string;
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
    make?: string | null;
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
    /** Filter by rating [1-5], or null for unrated */
    rating?: number | null;
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
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    visibility?: AssetVisibility;
    /** Include deleted assets */
    withDeleted?: boolean;
    /** Include EXIF data in response */
    withExif?: boolean;
    /** Include people data in response */
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
    make?: string | null;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Filter by person IDs */
    personIds?: string[];
    /** Filter by rating [1-5], or null for unrated */
    rating?: number | null;
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
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
    visibility?: AssetVisibility;
    /** Include deleted assets */
    withDeleted?: boolean;
    /** Include EXIF data in response */
    withExif?: boolean;
    /** Include people data in response */
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
    make?: string | null;
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
    /** Filter by rating [1-5], or null for unrated */
    rating?: number | null;
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
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
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
    make?: string | null;
    /** Filter by camera model */
    model?: string | null;
    /** Filter by OCR text content */
    ocr?: string;
    /** Filter by person IDs */
    personIds?: string[];
    /** Filter by rating [1-5], or null for unrated */
    rating?: number | null;
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
    "type"?: AssetTypeEnum;
    /** Filter by update date (after) */
    updatedAfter?: string;
    /** Filter by update date (before) */
    updatedBefore?: string;
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
export type LicenseKeyDto = {
    /** Activation key */
    activationKey: string;
    /** License key (format: /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/) */
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
export type ServerPingResponse = {
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
    /** Array of usage for each user */
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
    error?: AssetIdErrorReason;
    /** Whether operation succeeded */
    success: boolean;
};
export type StackResponseDto = {
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
    "type": SyncEntityType;
};
export type SyncAckSetDto = {
    /** Acknowledgment IDs (max 1000) */
    acks: string[];
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
    targetAudioCodec: AudioCodec;
    /** Target resolution */
    targetResolution: string;
    targetVideoCodec: VideoCodec;
    /** Temporal AQ */
    temporalAQ: boolean;
    /** Threads */
    threads: number;
    tonemap: ToneMapping;
    transcode: TranscodePolicy;
    /** Two pass */
    twoPass: boolean;
};
export type SystemConfigGeneratedFullsizeImageDto = {
    /** Enabled */
    enabled: boolean;
    format: ImageFormat;
    /** Progressive */
    progressive?: boolean;
    /** Quality */
    quality: number;
};
export type SystemConfigGeneratedImageDto = {
    format: ImageFormat;
    /** Progressive */
    progressive?: boolean;
    /** Quality */
    quality: number;
    /** Size */
    size: number;
};
export type SystemConfigImageDto = {
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
    /** Cron expression */
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
    /** ML service URLs */
    urls: string[];
};
export type SystemConfigMapDto = {
    /** Dark map style URL */
    darkStyle: string;
    /** Enabled */
    enabled: boolean;
    /** Light map style URL */
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
    /** Start time */
    startTime: string;
    /** Sync quota usage */
    syncQuotaUsage: boolean;
};
export type SystemConfigNotificationsDto = {
    smtp: SystemConfigSmtpDto;
};
export type SystemConfigOAuthDto = {
    /** Allow insecure requests */
    allowInsecureRequests: boolean;
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
    /** End session endpoint */
    endSessionEndpoint: string;
    /** Issuer URL */
    issuerUrl: string;
    /** Mobile override enabled */
    mobileOverrideEnabled: boolean;
    /** Mobile redirect URI (set to empty string to disable) */
    mobileRedirectUri: string;
    /** Profile signing algorithm */
    profileSigningAlgorithm: string;
    /** OAuth prompt parameter (e.g. select_account, login, consent) */
    prompt: string;
    /** Role claim */
    roleClaim: string;
    /** Scope */
    scope: string;
    /** Signing algorithm */
    signingAlgorithm: string;
    /** Storage label claim */
    storageLabelClaim: string;
    /** Storage quota claim */
    storageQuotaClaim: string;
    /** Timeout */
    timeout: number;
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
    /** Album invite template */
    albumInviteTemplate: string;
    /** Album update template */
    albumUpdateTemplate: string;
    /** Welcome template */
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
    color?: string | null;
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
    /** Array of video/gif durations in hh:mm:ss.SSS format (null for static images) */
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
export type PluginConfigValue = any;
export type WorkflowActionConfig = {
    [key: string]: PluginConfigValue;
};
export type WorkflowActionResponseDto = {
    actionConfig: (WorkflowActionConfig) | null;
    /** Action ID */
    id: string;
    /** Action order */
    order: number;
    /** Plugin action ID */
    pluginActionId: string;
    /** Workflow ID */
    workflowId: string;
};
export type WorkflowFilterConfig = {
    [key: string]: PluginConfigValue;
};
export type WorkflowFilterResponseDto = {
    filterConfig: (WorkflowFilterConfig) | null;
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
    triggerType: PluginTriggerType;
};
export type WorkflowActionItemDto = {
    actionConfig?: WorkflowActionConfig;
    /** Plugin action ID */
    pluginActionId: string;
};
export type WorkflowFilterItemDto = {
    filterConfig?: WorkflowFilterConfig;
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
    triggerType?: PluginTriggerType;
};
export type LicenseResponseDto = UserLicense;
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
export type SyncAlbumV2 = {
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
    /** Thumbnail asset ID */
    thumbnailAssetId: string | null;
    /** Updated at */
    updatedAt: string;
};
export type SyncAssetDeleteV1 = {
    /** Asset ID */
    assetId: string;
};
export type SyncAssetEditDeleteV1 = {
    /** Edit ID */
    editId: string;
};
export type SyncAssetEditV1 = {
    action: AssetEditAction;
    /** Asset ID */
    assetId: string;
    /** Edit ID */
    id: string;
    /** Edit parameters */
    parameters: {
        [key: string]: any;
    };
    /** Edit sequence */
    sequence: number;
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
    /** Bounding box X1 */
    boundingBoxX1: number;
    /** Bounding box X2 */
    boundingBoxX2: number;
    /** Bounding box Y1 */
    boundingBoxY1: number;
    /** Bounding box Y2 */
    boundingBoxY2: number;
    /** Asset face ID */
    id: string;
    /** Image height */
    imageHeight: number;
    /** Image width */
    imageWidth: number;
    /** Person ID */
    personId: string | null;
    /** Source type */
    sourceType: string;
};
export type SyncAssetFaceV2 = {
    /** Asset ID */
    assetId: string;
    /** Bounding box X1 */
    boundingBoxX1: number;
    /** Bounding box X2 */
    boundingBoxX2: number;
    /** Bounding box Y1 */
    boundingBoxY1: number;
    /** Bounding box Y2 */
    boundingBoxY2: number;
    /** Face deleted at */
    deletedAt: string | null;
    /** Asset face ID */
    id: string;
    /** Image height */
    imageHeight: number;
    /** Image width */
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
    value: {
        [key: string]: any;
    };
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
    "type": AssetTypeEnum;
    visibility: AssetVisibility;
    /** Asset width */
    width: number | null;
};
export type SyncAuthUserV1 = {
    avatarColor?: (UserAvatarColor) | null;
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
    /** Quota size in bytes */
    quotaSizeInBytes: number | null;
    /** Quota usage in bytes */
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
    data: {
        [key: string]: any;
    };
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
    key: UserMetadataKey;
    /** User ID */
    userId: string;
};
export type SyncUserMetadataV1 = {
    key: UserMetadataKey;
    /** User ID */
    userId: string;
    /** User metadata value */
    value: {
        [key: string]: any;
    };
};
export type SyncUserV1 = {
    avatarColor?: (UserAvatarColor) | null;
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
export declare function getActivities({ albumId, assetId, level, $type, userId }: {
    albumId: string;
    assetId?: string;
    level?: ReactionLevel;
    $type?: ReactionType;
    userId?: string;
}, opts?: Oazapfts.RequestOpts): Promise<ActivityResponseDto[]>;
/**
 * Create an activity
 */
export declare function createActivity({ activityCreateDto }: {
    activityCreateDto: ActivityCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<ActivityResponseDto>;
/**
 * Retrieve activity statistics
 */
export declare function getActivityStatistics({ albumId, assetId }: {
    albumId: string;
    assetId?: string;
}, opts?: Oazapfts.RequestOpts): Promise<ActivityStatisticsResponseDto>;
/**
 * Delete an activity
 */
export declare function deleteActivity({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Unlink all OAuth accounts
 */
export declare function unlinkAllOAuthAccountsAdmin(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Delete database backup
 */
export declare function deleteDatabaseBackup({ databaseBackupDeleteDto }: {
    databaseBackupDeleteDto: DatabaseBackupDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * List database backups
 */
export declare function listDatabaseBackups(opts?: Oazapfts.RequestOpts): Promise<DatabaseBackupListResponseDto>;
/**
 * Start database backup restore flow
 */
export declare function startDatabaseRestoreFlow(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Upload database backup
 */
export declare function uploadDatabaseBackup({ databaseBackupUploadDto }: {
    databaseBackupUploadDto: DatabaseBackupUploadDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Download database backup
 */
export declare function downloadDatabaseBackup({ filename }: {
    filename: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * Set maintenance mode
 */
export declare function setMaintenanceMode({ setMaintenanceModeDto }: {
    setMaintenanceModeDto: SetMaintenanceModeDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Detect existing install
 */
export declare function detectPriorInstall(opts?: Oazapfts.RequestOpts): Promise<MaintenanceDetectInstallResponseDto>;
/**
 * Log into maintenance mode
 */
export declare function maintenanceLogin({ maintenanceLoginDto }: {
    maintenanceLoginDto: MaintenanceLoginDto;
}, opts?: Oazapfts.RequestOpts): Promise<MaintenanceAuthDto>;
/**
 * Get maintenance mode status
 */
export declare function getMaintenanceStatus(opts?: Oazapfts.RequestOpts): Promise<MaintenanceStatusResponseDto>;
/**
 * Create a notification
 */
export declare function createNotification({ notificationCreateDto }: {
    notificationCreateDto: NotificationCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<NotificationDto>;
/**
 * Render email template
 */
export declare function getNotificationTemplateAdmin({ name, templateDto }: {
    name: string;
    templateDto: TemplateDto;
}, opts?: Oazapfts.RequestOpts): Promise<TemplateResponseDto>;
/**
 * Send test email
 */
export declare function sendTestEmailAdmin({ systemConfigSmtpDto }: {
    systemConfigSmtpDto: SystemConfigSmtpDto;
}, opts?: Oazapfts.RequestOpts): Promise<TestEmailResponseDto>;
/**
 * Search users
 */
export declare function searchUsersAdmin({ id, withDeleted }: {
    id?: string;
    withDeleted?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto[]>;
/**
 * Create a user
 */
export declare function createUserAdmin({ userAdminCreateDto }: {
    userAdminCreateDto: UserAdminCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Delete a user
 */
export declare function deleteUserAdmin({ id, userAdminDeleteDto }: {
    id: string;
    userAdminDeleteDto: UserAdminDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Retrieve a user
 */
export declare function getUserAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Update a user
 */
export declare function updateUserAdmin({ id, userAdminUpdateDto }: {
    id: string;
    userAdminUpdateDto: UserAdminUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Retrieve user preferences
 */
export declare function getUserPreferencesAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<UserPreferencesResponseDto>;
/**
 * Update user preferences
 */
export declare function updateUserPreferencesAdmin({ id, userPreferencesUpdateDto }: {
    id: string;
    userPreferencesUpdateDto: UserPreferencesUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserPreferencesResponseDto>;
/**
 * Restore a deleted user
 */
export declare function restoreUserAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Retrieve user sessions
 */
export declare function getUserSessionsAdmin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<SessionResponseDto[]>;
/**
 * Retrieve user statistics
 */
export declare function getUserStatisticsAdmin({ id, isFavorite, isTrashed, visibility }: {
    id: string;
    isFavorite?: boolean;
    isTrashed?: boolean;
    visibility?: AssetVisibility;
}, opts?: Oazapfts.RequestOpts): Promise<AssetStatsResponseDto>;
/**
 * List all albums
 */
export declare function getAllAlbums({ assetId, shared }: {
    assetId?: string;
    shared?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumResponseDto[]>;
/**
 * Create an album
 */
export declare function createAlbum({ createAlbumDto }: {
    createAlbumDto: CreateAlbumDto;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumResponseDto>;
/**
 * Add assets to albums
 */
export declare function addAssetsToAlbums({ albumsAddAssetsDto }: {
    albumsAddAssetsDto: AlbumsAddAssetsDto;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumsAddAssetsResponseDto>;
/**
 * Retrieve album statistics
 */
export declare function getAlbumStatistics(opts?: Oazapfts.RequestOpts): Promise<AlbumStatisticsResponseDto>;
/**
 * Delete an album
 */
export declare function deleteAlbum({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve an album
 */
export declare function getAlbumInfo({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumResponseDto>;
/**
 * Update an album
 */
export declare function updateAlbumInfo({ id, updateAlbumDto }: {
    id: string;
    updateAlbumDto: UpdateAlbumDto;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumResponseDto>;
/**
 * Remove assets from an album
 */
export declare function removeAssetFromAlbum({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Add assets to an album
 */
export declare function addAssetsToAlbum({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Retrieve album map markers
 */
export declare function getAlbumMapMarkers({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<MapMarkerResponseDto[]>;
/**
 * Remove user from album
 */
export declare function removeUserFromAlbum({ id, userId }: {
    id: string;
    userId: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Update user role
 */
export declare function updateAlbumUser({ id, userId, updateAlbumUserDto }: {
    id: string;
    userId: string;
    updateAlbumUserDto: UpdateAlbumUserDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Share album with users
 */
export declare function addUsersToAlbum({ id, addUsersDto }: {
    id: string;
    addUsersDto: AddUsersDto;
}, opts?: Oazapfts.RequestOpts): Promise<AlbumResponseDto>;
/**
 * List all API keys
 */
export declare function getApiKeys(opts?: Oazapfts.RequestOpts): Promise<ApiKeyResponseDto[]>;
/**
 * Create an API key
 */
export declare function createApiKey({ apiKeyCreateDto }: {
    apiKeyCreateDto: ApiKeyCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<ApiKeyCreateResponseDto>;
/**
 * Retrieve the current API key
 */
export declare function getMyApiKey(opts?: Oazapfts.RequestOpts): Promise<ApiKeyResponseDto>;
/**
 * Delete an API key
 */
export declare function deleteApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve an API key
 */
export declare function getApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<ApiKeyResponseDto>;
/**
 * Update an API key
 */
export declare function updateApiKey({ id, apiKeyUpdateDto }: {
    id: string;
    apiKeyUpdateDto: ApiKeyUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<ApiKeyResponseDto>;
/**
 * Delete assets
 */
export declare function deleteAssets({ assetBulkDeleteDto }: {
    assetBulkDeleteDto: AssetBulkDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Upload asset
 */
export declare function uploadAsset({ key, slug, xImmichChecksum, assetMediaCreateDto }: {
    key?: string;
    slug?: string;
    xImmichChecksum?: string;
    assetMediaCreateDto: AssetMediaCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetMediaResponseDto>;
/**
 * Update assets
 */
export declare function updateAssets({ assetBulkUpdateDto }: {
    assetBulkUpdateDto: AssetBulkUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Check bulk upload
 */
export declare function checkBulkUpload({ assetBulkUploadCheckDto }: {
    assetBulkUploadCheckDto: AssetBulkUploadCheckDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetBulkUploadCheckResponseDto>;
/**
 * Copy asset
 */
export declare function copyAsset({ assetCopyDto }: {
    assetCopyDto: AssetCopyDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Run an asset job
 */
export declare function runAssetJobs({ assetJobsDto }: {
    assetJobsDto: AssetJobsDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Delete asset metadata
 */
export declare function deleteBulkAssetMetadata({ assetMetadataBulkDeleteDto }: {
    assetMetadataBulkDeleteDto: AssetMetadataBulkDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Upsert asset metadata
 */
export declare function updateBulkAssetMetadata({ assetMetadataBulkUpsertDto }: {
    assetMetadataBulkUpsertDto: AssetMetadataBulkUpsertDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetMetadataBulkResponseDto[]>;
/**
 * Get asset statistics
 */
export declare function getAssetStatistics({ isFavorite, isTrashed, visibility }: {
    isFavorite?: boolean;
    isTrashed?: boolean;
    visibility?: AssetVisibility;
}, opts?: Oazapfts.RequestOpts): Promise<AssetStatsResponseDto>;
/**
 * Retrieve an asset
 */
export declare function getAssetInfo({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto>;
/**
 * Update an asset
 */
export declare function updateAsset({ id, updateAssetDto }: {
    id: string;
    updateAssetDto: UpdateAssetDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto>;
/**
 * Remove edits from an existing asset
 */
export declare function removeAssetEdits({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve edits for an existing asset
 */
export declare function getAssetEdits({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetEditsResponseDto>;
/**
 * Apply edits to an existing asset
 */
export declare function editAsset({ id, assetEditsCreateDto }: {
    id: string;
    assetEditsCreateDto: AssetEditsCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetEditsResponseDto>;
/**
 * Get asset metadata
 */
export declare function getAssetMetadata({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetMetadataResponseDto[]>;
/**
 * Update asset metadata
 */
export declare function updateAssetMetadata({ id, assetMetadataUpsertDto }: {
    id: string;
    assetMetadataUpsertDto: AssetMetadataUpsertDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetMetadataResponseDto[]>;
/**
 * Delete asset metadata by key
 */
export declare function deleteAssetMetadata({ id, key }: {
    id: string;
    key: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve asset metadata by key
 */
export declare function getAssetMetadataByKey({ id, key }: {
    id: string;
    key: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetMetadataResponseDto>;
/**
 * Retrieve asset OCR data
 */
export declare function getAssetOcr({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetOcrResponseDto[]>;
/**
 * Download original asset
 */
export declare function downloadAsset({ edited, id, key, slug }: {
    edited?: boolean;
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * View asset thumbnail
 */
export declare function viewAsset({ edited, id, key, size, slug }: {
    edited?: boolean;
    id: string;
    key?: string;
    size?: AssetMediaSize;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * Play asset video
 */
export declare function playAssetVideo({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * Register admin
 */
export declare function signUpAdmin({ signUpDto }: {
    signUpDto: SignUpDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Change password
 */
export declare function changePassword({ changePasswordDto }: {
    changePasswordDto: ChangePasswordDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Login
 */
export declare function login({ loginCredentialDto }: {
    loginCredentialDto: LoginCredentialDto;
}, opts?: Oazapfts.RequestOpts): Promise<LoginResponseDto>;
/**
 * Logout
 */
export declare function logout(opts?: Oazapfts.RequestOpts): Promise<LogoutResponseDto>;
/**
 * Reset pin code
 */
export declare function resetPinCode({ pinCodeResetDto }: {
    pinCodeResetDto: PinCodeResetDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Setup pin code
 */
export declare function setupPinCode({ pinCodeSetupDto }: {
    pinCodeSetupDto: PinCodeSetupDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Change pin code
 */
export declare function changePinCode({ pinCodeChangeDto }: {
    pinCodeChangeDto: PinCodeChangeDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Lock auth session
 */
export declare function lockAuthSession(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Unlock auth session
 */
export declare function unlockAuthSession({ sessionUnlockDto }: {
    sessionUnlockDto: SessionUnlockDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve auth status
 */
export declare function getAuthStatus(opts?: Oazapfts.RequestOpts): Promise<AuthStatusResponseDto>;
/**
 * Validate access token
 */
export declare function validateAccessToken(opts?: Oazapfts.RequestOpts): Promise<ValidateAccessTokenResponseDto>;
/**
 * Download asset archive
 */
export declare function downloadArchive({ key, slug, downloadArchiveDto }: {
    key?: string;
    slug?: string;
    downloadArchiveDto: DownloadArchiveDto;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * Retrieve download information
 */
export declare function getDownloadInfo({ key, slug, downloadInfoDto }: {
    key?: string;
    slug?: string;
    downloadInfoDto: DownloadInfoDto;
}, opts?: Oazapfts.RequestOpts): Promise<DownloadResponseDto>;
/**
 * Delete duplicates
 */
export declare function deleteDuplicates({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve duplicates
 */
export declare function getAssetDuplicates(opts?: Oazapfts.RequestOpts): Promise<DuplicateResponseDto[]>;
/**
 * Resolve duplicate groups
 */
export declare function resolveDuplicates({ duplicateResolveDto }: {
    duplicateResolveDto: DuplicateResolveDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Delete a duplicate
 */
export declare function deleteDuplicate({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve faces for asset
 */
export declare function getFaces({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetFaceResponseDto[]>;
/**
 * Create a face
 */
export declare function createFace({ assetFaceCreateDto }: {
    assetFaceCreateDto: AssetFaceCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Delete a face
 */
export declare function deleteFace({ id, assetFaceDeleteDto }: {
    id: string;
    assetFaceDeleteDto: AssetFaceDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Re-assign a face to another person
 */
export declare function reassignFacesById({ id, faceDto }: {
    id: string;
    faceDto: FaceDto;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto>;
/**
 * Retrieve queue counts and status
 */
export declare function getQueuesLegacy(opts?: Oazapfts.RequestOpts): Promise<QueuesResponseLegacyDto>;
/**
 * Create a manual job
 */
export declare function createJob({ jobCreateDto }: {
    jobCreateDto: JobCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Run jobs
 */
export declare function runQueueCommandLegacy({ name, queueCommandDto }: {
    name: QueueName;
    queueCommandDto: QueueCommandDto;
}, opts?: Oazapfts.RequestOpts): Promise<QueueResponseLegacyDto>;
/**
 * Retrieve libraries
 */
export declare function getAllLibraries(opts?: Oazapfts.RequestOpts): Promise<LibraryResponseDto[]>;
/**
 * Create a library
 */
export declare function createLibrary({ createLibraryDto }: {
    createLibraryDto: CreateLibraryDto;
}, opts?: Oazapfts.RequestOpts): Promise<LibraryResponseDto>;
/**
 * Delete a library
 */
export declare function deleteLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a library
 */
export declare function getLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<LibraryResponseDto>;
/**
 * Update a library
 */
export declare function updateLibrary({ id, updateLibraryDto }: {
    id: string;
    updateLibraryDto: UpdateLibraryDto;
}, opts?: Oazapfts.RequestOpts): Promise<LibraryResponseDto>;
/**
 * Scan a library
 */
export declare function scanLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve library statistics
 */
export declare function getLibraryStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<LibraryStatsResponseDto>;
/**
 * Validate library settings
 */
export declare function validate({ id, validateLibraryDto }: {
    id: string;
    validateLibraryDto: ValidateLibraryDto;
}, opts?: Oazapfts.RequestOpts): Promise<ValidateLibraryResponseDto>;
/**
 * Retrieve map markers
 */
export declare function getMapMarkers({ fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums }: {
    fileCreatedAfter?: string;
    fileCreatedBefore?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    withPartners?: boolean;
    withSharedAlbums?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<MapMarkerResponseDto[]>;
/**
 * Reverse geocode coordinates
 */
export declare function reverseGeocode({ lat, lon }: {
    lat: number;
    lon: number;
}, opts?: Oazapfts.RequestOpts): Promise<MapReverseGeocodeResponseDto[]>;
/**
 * Retrieve memories
 */
export declare function searchMemories({ $for, isSaved, isTrashed, order, size, $type }: {
    $for?: string;
    isSaved?: boolean;
    isTrashed?: boolean;
    order?: MemorySearchOrder;
    size?: number;
    $type?: MemoryType;
}, opts?: Oazapfts.RequestOpts): Promise<MemoryResponseDto[]>;
/**
 * Create a memory
 */
export declare function createMemory({ memoryCreateDto }: {
    memoryCreateDto: MemoryCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<MemoryResponseDto>;
/**
 * Retrieve memories statistics
 */
export declare function memoriesStatistics({ $for, isSaved, isTrashed, order, size, $type }: {
    $for?: string;
    isSaved?: boolean;
    isTrashed?: boolean;
    order?: MemorySearchOrder;
    size?: number;
    $type?: MemoryType;
}, opts?: Oazapfts.RequestOpts): Promise<MemoryStatisticsResponseDto>;
/**
 * Delete a memory
 */
export declare function deleteMemory({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a memory
 */
export declare function getMemory({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<MemoryResponseDto>;
/**
 * Update a memory
 */
export declare function updateMemory({ id, memoryUpdateDto }: {
    id: string;
    memoryUpdateDto: MemoryUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<MemoryResponseDto>;
/**
 * Remove assets from a memory
 */
export declare function removeMemoryAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Add assets to a memory
 */
export declare function addMemoryAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Delete notifications
 */
export declare function deleteNotifications({ notificationDeleteAllDto }: {
    notificationDeleteAllDto: NotificationDeleteAllDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve notifications
 */
export declare function getNotifications({ id, level, $type, unread }: {
    id?: string;
    level?: NotificationLevel;
    $type?: NotificationType;
    unread?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<NotificationDto[]>;
/**
 * Update notifications
 */
export declare function updateNotifications({ notificationUpdateAllDto }: {
    notificationUpdateAllDto: NotificationUpdateAllDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Delete a notification
 */
export declare function deleteNotification({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Get a notification
 */
export declare function getNotification({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<NotificationDto>;
/**
 * Update a notification
 */
export declare function updateNotification({ id, notificationUpdateDto }: {
    id: string;
    notificationUpdateDto: NotificationUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<NotificationDto>;
/**
 * Start OAuth
 */
export declare function startOAuth({ oAuthConfigDto }: {
    oAuthConfigDto: OAuthConfigDto;
}, opts?: Oazapfts.RequestOpts): Promise<OAuthAuthorizeResponseDto>;
/**
 * Backchannel OAuth logout
 */
export declare function logoutOAuth({ oAuthBackchannelLogoutDto }: {
    oAuthBackchannelLogoutDto: OAuthBackchannelLogoutDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Finish OAuth
 */
export declare function finishOAuth({ oAuthCallbackDto }: {
    oAuthCallbackDto: OAuthCallbackDto;
}, opts?: Oazapfts.RequestOpts): Promise<LoginResponseDto>;
/**
 * Link OAuth account
 */
export declare function linkOAuthAccount({ oAuthCallbackDto }: {
    oAuthCallbackDto: OAuthCallbackDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Redirect OAuth to mobile
 */
export declare function redirectOAuthToMobile(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Unlink OAuth account
 */
export declare function unlinkOAuthAccount(opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Retrieve partners
 */
export declare function getPartners({ direction }: {
    direction: PartnerDirection;
}, opts?: Oazapfts.RequestOpts): Promise<PartnerResponseDto[]>;
/**
 * Create a partner
 */
export declare function createPartner({ partnerCreateDto }: {
    partnerCreateDto: PartnerCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<PartnerResponseDto>;
/**
 * Remove a partner
 */
export declare function removePartner({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Create a partner
 */
export declare function createPartnerDeprecated({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<PartnerResponseDto>;
/**
 * Update a partner
 */
export declare function updatePartner({ id, partnerUpdateDto }: {
    id: string;
    partnerUpdateDto: PartnerUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<PartnerResponseDto>;
/**
 * Delete people
 */
export declare function deletePeople({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Get all people
 */
export declare function getAllPeople({ closestAssetId, closestPersonId, page, size, withHidden }: {
    closestAssetId?: string;
    closestPersonId?: string;
    page?: number;
    size?: number;
    withHidden?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<PeopleResponseDto>;
/**
 * Create a person
 */
export declare function createPerson({ personCreateDto }: {
    personCreateDto: PersonCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto>;
/**
 * Update people
 */
export declare function updatePeople({ peopleUpdateDto }: {
    peopleUpdateDto: PeopleUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Delete person
 */
export declare function deletePerson({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Get a person
 */
export declare function getPerson({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto>;
/**
 * Update person
 */
export declare function updatePerson({ id, personUpdateDto }: {
    id: string;
    personUpdateDto: PersonUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto>;
/**
 * Merge people
 */
export declare function mergePerson({ id, mergePersonDto }: {
    id: string;
    mergePersonDto: MergePersonDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Reassign faces
 */
export declare function reassignFaces({ id, assetFaceUpdateDto }: {
    id: string;
    assetFaceUpdateDto: AssetFaceUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto[]>;
/**
 * Get person statistics
 */
export declare function getPersonStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<PersonStatisticsResponseDto>;
/**
 * Get person thumbnail
 */
export declare function getPersonThumbnail({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * List all plugins
 */
export declare function getPlugins(opts?: Oazapfts.RequestOpts): Promise<PluginResponseDto[]>;
/**
 * List all plugin triggers
 */
export declare function getPluginTriggers(opts?: Oazapfts.RequestOpts): Promise<PluginTriggerResponseDto[]>;
/**
 * Retrieve a plugin
 */
export declare function getPlugin({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<PluginResponseDto>;
/**
 * List all queues
 */
export declare function getQueues(opts?: Oazapfts.RequestOpts): Promise<QueueResponseDto[]>;
/**
 * Retrieve a queue
 */
export declare function getQueue({ name }: {
    name: QueueName;
}, opts?: Oazapfts.RequestOpts): Promise<QueueResponseDto>;
/**
 * Update a queue
 */
export declare function updateQueue({ name, queueUpdateDto }: {
    name: QueueName;
    queueUpdateDto: QueueUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<QueueResponseDto>;
/**
 * Empty a queue
 */
export declare function emptyQueue({ name, queueDeleteDto }: {
    name: QueueName;
    queueDeleteDto: QueueDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve queue jobs
 */
export declare function getQueueJobs({ name, status }: {
    name: QueueName;
    status?: QueueJobStatus[];
}, opts?: Oazapfts.RequestOpts): Promise<QueueJobResponseDto[]>;
/**
 * Retrieve assets by city
 */
export declare function getAssetsByCity(opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto[]>;
/**
 * Retrieve explore data
 */
export declare function getExploreData(opts?: Oazapfts.RequestOpts): Promise<SearchExploreResponseDto[]>;
/**
 * Search large assets
 */
export declare function searchLargeAssets({ albumIds, city, country, createdAfter, createdBefore, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, lensModel, libraryId, make, minFileSize, model, ocr, personIds, rating, size, state, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, $type, updatedAfter, updatedBefore, visibility, withDeleted, withExif }: {
    albumIds?: string[];
    city?: string | null;
    country?: string | null;
    createdAfter?: string;
    createdBefore?: string;
    isEncoded?: boolean;
    isFavorite?: boolean;
    isMotion?: boolean;
    isNotInAlbum?: boolean;
    isOffline?: boolean;
    lensModel?: string | null;
    libraryId?: string | null;
    make?: string | null;
    minFileSize?: number;
    model?: string | null;
    ocr?: string;
    personIds?: string[];
    rating?: number | null;
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
}, opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto[]>;
/**
 * Search assets by metadata
 */
export declare function searchAssets({ metadataSearchDto }: {
    metadataSearchDto: MetadataSearchDto;
}, opts?: Oazapfts.RequestOpts): Promise<SearchResponseDto>;
/**
 * Search people
 */
export declare function searchPerson({ name, withHidden }: {
    name: string;
    withHidden?: boolean;
}, opts?: Oazapfts.RequestOpts): Promise<PersonResponseDto[]>;
/**
 * Search places
 */
export declare function searchPlaces({ name }: {
    name: string;
}, opts?: Oazapfts.RequestOpts): Promise<PlacesResponseDto[]>;
/**
 * Search random assets
 */
export declare function searchRandom({ randomSearchDto }: {
    randomSearchDto: RandomSearchDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto[]>;
/**
 * Smart asset search
 */
export declare function searchSmart({ smartSearchDto }: {
    smartSearchDto: SmartSearchDto;
}, opts?: Oazapfts.RequestOpts): Promise<SearchResponseDto>;
/**
 * Search asset statistics
 */
export declare function searchAssetStatistics({ statisticsSearchDto }: {
    statisticsSearchDto: StatisticsSearchDto;
}, opts?: Oazapfts.RequestOpts): Promise<SearchStatisticsResponseDto>;
/**
 * Retrieve search suggestions
 */
export declare function getSearchSuggestions({ country, includeNull, lensModel, make, model, state, $type }: {
    country?: string;
    includeNull?: boolean;
    lensModel?: string;
    make?: string;
    model?: string;
    state?: string;
    $type: SearchSuggestionType;
}, opts?: Oazapfts.RequestOpts): Promise<string[]>;
/**
 * Get server information
 */
export declare function getAboutInfo(opts?: Oazapfts.RequestOpts): Promise<ServerAboutResponseDto>;
/**
 * Get APK links
 */
export declare function getApkLinks(opts?: Oazapfts.RequestOpts): Promise<ServerApkLinksDto>;
/**
 * Get config
 */
export declare function getServerConfig(opts?: Oazapfts.RequestOpts): Promise<ServerConfigDto>;
/**
 * Get features
 */
export declare function getServerFeatures(opts?: Oazapfts.RequestOpts): Promise<ServerFeaturesDto>;
/**
 * Delete server product key
 */
export declare function deleteServerLicense(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Get product key
 */
export declare function getServerLicense(opts?: Oazapfts.RequestOpts): Promise<UserLicense>;
/**
 * Set server product key
 */
export declare function setServerLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserLicense>;
/**
 * Get supported media types
 */
export declare function getSupportedMediaTypes(opts?: Oazapfts.RequestOpts): Promise<ServerMediaTypesResponseDto>;
/**
 * Ping
 */
export declare function pingServer(opts?: Oazapfts.RequestOpts): Promise<ServerPingResponse>;
/**
 * Get statistics
 */
export declare function getServerStatistics(opts?: Oazapfts.RequestOpts): Promise<ServerStatsResponseDto>;
/**
 * Get storage
 */
export declare function getStorage(opts?: Oazapfts.RequestOpts): Promise<ServerStorageResponseDto>;
/**
 * Get server version
 */
export declare function getServerVersion(opts?: Oazapfts.RequestOpts): Promise<ServerVersionResponseDto>;
/**
 * Get version check status
 */
export declare function getVersionCheck(opts?: Oazapfts.RequestOpts): Promise<VersionCheckStateResponseDto>;
/**
 * Get version history
 */
export declare function getVersionHistory(opts?: Oazapfts.RequestOpts): Promise<ServerVersionHistoryResponseDto[]>;
/**
 * Delete all sessions
 */
export declare function deleteAllSessions(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve sessions
 */
export declare function getSessions(opts?: Oazapfts.RequestOpts): Promise<SessionResponseDto[]>;
/**
 * Create a session
 */
export declare function createSession({ sessionCreateDto }: {
    sessionCreateDto: SessionCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<SessionCreateResponseDto>;
/**
 * Delete a session
 */
export declare function deleteSession({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Update a session
 */
export declare function updateSession({ id, sessionUpdateDto }: {
    id: string;
    sessionUpdateDto: SessionUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<SessionResponseDto>;
/**
 * Lock a session
 */
export declare function lockSession({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve all shared links
 */
export declare function getAllSharedLinks({ albumId, id }: {
    albumId?: string;
    id?: string;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto[]>;
/**
 * Create a shared link
 */
export declare function createSharedLink({ sharedLinkCreateDto }: {
    sharedLinkCreateDto: SharedLinkCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto>;
/**
 * Shared link login
 */
export declare function sharedLinkLogin({ key, slug, sharedLinkLoginDto }: {
    key?: string;
    slug?: string;
    sharedLinkLoginDto: SharedLinkLoginDto;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto>;
/**
 * Retrieve current shared link
 */
export declare function getMySharedLink({ key, slug }: {
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto>;
/**
 * Delete a shared link
 */
export declare function removeSharedLink({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a shared link
 */
export declare function getSharedLinkById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto>;
/**
 * Update a shared link
 */
export declare function updateSharedLink({ id, sharedLinkEditDto }: {
    id: string;
    sharedLinkEditDto: SharedLinkEditDto;
}, opts?: Oazapfts.RequestOpts): Promise<SharedLinkResponseDto>;
/**
 * Remove assets from a shared link
 */
export declare function removeSharedLinkAssets({ id, assetIdsDto }: {
    id: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetIdsResponseDto[]>;
/**
 * Add assets to a shared link
 */
export declare function addSharedLinkAssets({ id, assetIdsDto }: {
    id: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<AssetIdsResponseDto[]>;
/**
 * Delete stacks
 */
export declare function deleteStacks({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve stacks
 */
export declare function searchStacks({ primaryAssetId }: {
    primaryAssetId?: string;
}, opts?: Oazapfts.RequestOpts): Promise<StackResponseDto[]>;
/**
 * Create a stack
 */
export declare function createStack({ stackCreateDto }: {
    stackCreateDto: StackCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<StackResponseDto>;
/**
 * Delete a stack
 */
export declare function deleteStack({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a stack
 */
export declare function getStack({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<StackResponseDto>;
/**
 * Update a stack
 */
export declare function updateStack({ id, stackUpdateDto }: {
    id: string;
    stackUpdateDto: StackUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<StackResponseDto>;
/**
 * Remove an asset from a stack
 */
export declare function removeAssetFromStack({ assetId, id }: {
    assetId: string;
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Delete acknowledgements
 */
export declare function deleteSyncAck({ syncAckDeleteDto }: {
    syncAckDeleteDto: SyncAckDeleteDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve acknowledgements
 */
export declare function getSyncAck(opts?: Oazapfts.RequestOpts): Promise<SyncAckDto[]>;
/**
 * Acknowledge changes
 */
export declare function sendSyncAck({ syncAckSetDto }: {
    syncAckSetDto: SyncAckSetDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Stream sync changes
 */
export declare function getSyncStream({ syncStreamDto }: {
    syncStreamDto: SyncStreamDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Get system configuration
 */
export declare function getConfig(opts?: Oazapfts.RequestOpts): Promise<SystemConfigDto>;
/**
 * Update system configuration
 */
export declare function updateConfig({ systemConfigDto }: {
    systemConfigDto: SystemConfigDto;
}, opts?: Oazapfts.RequestOpts): Promise<SystemConfigDto>;
/**
 * Get system configuration defaults
 */
export declare function getConfigDefaults(opts?: Oazapfts.RequestOpts): Promise<SystemConfigDto>;
/**
 * Get storage template options
 */
export declare function getStorageTemplateOptions(opts?: Oazapfts.RequestOpts): Promise<SystemConfigTemplateStorageOptionDto>;
/**
 * Retrieve admin onboarding
 */
export declare function getAdminOnboarding(opts?: Oazapfts.RequestOpts): Promise<AdminOnboardingUpdateDto>;
/**
 * Update admin onboarding
 */
export declare function updateAdminOnboarding({ adminOnboardingUpdateDto }: {
    adminOnboardingUpdateDto: AdminOnboardingUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve reverse geocoding state
 */
export declare function getReverseGeocodingState(opts?: Oazapfts.RequestOpts): Promise<ReverseGeocodingStateResponseDto>;
/**
 * Retrieve version check state
 */
export declare function getVersionCheckState(opts?: Oazapfts.RequestOpts): Promise<VersionCheckStateResponseDto>;
/**
 * Retrieve tags
 */
export declare function getAllTags(opts?: Oazapfts.RequestOpts): Promise<TagResponseDto[]>;
/**
 * Create a tag
 */
export declare function createTag({ tagCreateDto }: {
    tagCreateDto: TagCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<TagResponseDto>;
/**
 * Upsert tags
 */
export declare function upsertTags({ tagUpsertDto }: {
    tagUpsertDto: TagUpsertDto;
}, opts?: Oazapfts.RequestOpts): Promise<TagResponseDto[]>;
/**
 * Tag assets
 */
export declare function bulkTagAssets({ tagBulkAssetsDto }: {
    tagBulkAssetsDto: TagBulkAssetsDto;
}, opts?: Oazapfts.RequestOpts): Promise<TagBulkAssetsResponseDto>;
/**
 * Delete a tag
 */
export declare function deleteTag({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a tag
 */
export declare function getTagById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<TagResponseDto>;
/**
 * Update a tag
 */
export declare function updateTag({ id, tagUpdateDto }: {
    id: string;
    tagUpdateDto: TagUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<TagResponseDto>;
/**
 * Untag assets
 */
export declare function untagAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Tag assets
 */
export declare function tagAssets({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<BulkIdResponseDto[]>;
/**
 * Get time bucket
 */
export declare function getTimeBucket({ albumId, bbox, isFavorite, isTrashed, key, order, personId, slug, tagId, timeBucket, userId, visibility, withCoordinates, withPartners, withStacked }: {
    albumId?: string;
    bbox?: string;
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
}, opts?: Oazapfts.RequestOpts): Promise<TimeBucketAssetResponseDto>;
/**
 * Get time buckets
 */
export declare function getTimeBuckets({ albumId, bbox, isFavorite, isTrashed, key, order, personId, slug, tagId, userId, visibility, withCoordinates, withPartners, withStacked }: {
    albumId?: string;
    bbox?: string;
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
}, opts?: Oazapfts.RequestOpts): Promise<TimeBucketsResponseDto[]>;
/**
 * Empty trash
 */
export declare function emptyTrash(opts?: Oazapfts.RequestOpts): Promise<TrashResponseDto>;
/**
 * Restore trash
 */
export declare function restoreTrash(opts?: Oazapfts.RequestOpts): Promise<TrashResponseDto>;
/**
 * Restore assets
 */
export declare function restoreAssets({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts): Promise<TrashResponseDto>;
/**
 * Get all users
 */
export declare function searchUsers(opts?: Oazapfts.RequestOpts): Promise<UserResponseDto[]>;
/**
 * Get current user
 */
export declare function getMyUser(opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Update current user
 */
export declare function updateMyUser({ userUpdateMeDto }: {
    userUpdateMeDto: UserUpdateMeDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserAdminResponseDto>;
/**
 * Delete user product key
 */
export declare function deleteUserLicense(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve user product key
 */
export declare function getUserLicense(opts?: Oazapfts.RequestOpts): Promise<UserLicense>;
/**
 * Set user product key
 */
export declare function setUserLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserLicense>;
/**
 * Delete user onboarding
 */
export declare function deleteUserOnboarding(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve user onboarding
 */
export declare function getUserOnboarding(opts?: Oazapfts.RequestOpts): Promise<OnboardingResponseDto>;
/**
 * Update user onboarding
 */
export declare function setUserOnboarding({ onboardingDto }: {
    onboardingDto: OnboardingDto;
}, opts?: Oazapfts.RequestOpts): Promise<OnboardingResponseDto>;
/**
 * Get my preferences
 */
export declare function getMyPreferences(opts?: Oazapfts.RequestOpts): Promise<UserPreferencesResponseDto>;
/**
 * Update my preferences
 */
export declare function updateMyPreferences({ userPreferencesUpdateDto }: {
    userPreferencesUpdateDto: UserPreferencesUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<UserPreferencesResponseDto>;
/**
 * Delete user profile image
 */
export declare function deleteProfileImage(opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Create user profile image
 */
export declare function createProfileImage({ createProfileImageDto }: {
    createProfileImageDto: CreateProfileImageDto;
}, opts?: Oazapfts.RequestOpts): Promise<CreateProfileImageResponseDto>;
/**
 * Retrieve a user
 */
export declare function getUser({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<UserResponseDto>;
/**
 * Retrieve user profile image
 */
export declare function getProfileImage({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<Blob>;
/**
 * Retrieve assets by original path
 */
export declare function getAssetsByOriginalPath({ path }: {
    path: string;
}, opts?: Oazapfts.RequestOpts): Promise<AssetResponseDto[]>;
/**
 * Retrieve unique paths
 */
export declare function getUniqueOriginalPaths(opts?: Oazapfts.RequestOpts): Promise<string[]>;
/**
 * List all workflows
 */
export declare function getWorkflows(opts?: Oazapfts.RequestOpts): Promise<WorkflowResponseDto[]>;
/**
 * Create a workflow
 */
export declare function createWorkflow({ workflowCreateDto }: {
    workflowCreateDto: WorkflowCreateDto;
}, opts?: Oazapfts.RequestOpts): Promise<WorkflowResponseDto>;
/**
 * Delete a workflow
 */
export declare function deleteWorkflow({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<never>;
/**
 * Retrieve a workflow
 */
export declare function getWorkflow({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts): Promise<WorkflowResponseDto>;
/**
 * Update a workflow
 */
export declare function updateWorkflow({ id, workflowUpdateDto }: {
    id: string;
    workflowUpdateDto: WorkflowUpdateDto;
}, opts?: Oazapfts.RequestOpts): Promise<WorkflowResponseDto>;
export declare enum ReactionLevel {
    Album = "album",
    Asset = "asset"
}
export declare enum ReactionType {
    Comment = "comment",
    Like = "like"
}
export declare enum UserAvatarColor {
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
export declare enum MaintenanceAction {
    Start = "start",
    End = "end",
    SelectDatabaseRestore = "select_database_restore",
    RestoreDatabase = "restore_database"
}
export declare enum StorageFolder {
    EncodedVideo = "encoded-video",
    Library = "library",
    Upload = "upload",
    Profile = "profile",
    Thumbs = "thumbs",
    Backups = "backups"
}
export declare enum NotificationLevel {
    Success = "success",
    Error = "error",
    Warning = "warning",
    Info = "info"
}
export declare enum NotificationType {
    JobFailed = "JobFailed",
    BackupFailed = "BackupFailed",
    SystemMessage = "SystemMessage",
    AlbumInvite = "AlbumInvite",
    AlbumUpdate = "AlbumUpdate",
    Custom = "Custom"
}
export declare enum UserStatus {
    Active = "active",
    Removing = "removing",
    Deleted = "deleted"
}
export declare enum AssetOrder {
    Asc = "asc",
    Desc = "desc"
}
export declare enum AssetVisibility {
    Archive = "archive",
    Timeline = "timeline",
    Hidden = "hidden",
    Locked = "locked"
}
export declare enum AlbumUserRole {
    Editor = "editor",
    Owner = "owner",
    Viewer = "viewer"
}
export declare enum BulkIdErrorReason {
    Duplicate = "duplicate",
    NoPermission = "no_permission",
    NotFound = "not_found",
    Unknown = "unknown",
    Validation = "validation"
}
export declare enum Permission {
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
export declare enum AssetMediaStatus {
    Created = "created",
    Duplicate = "duplicate"
}
export declare enum AssetUploadAction {
    Accept = "accept",
    Reject = "reject"
}
export declare enum AssetRejectReason {
    Duplicate = "duplicate",
    UnsupportedFormat = "unsupported-format"
}
export declare enum AssetJobName {
    RefreshFaces = "refresh-faces",
    RefreshMetadata = "refresh-metadata",
    RegenerateThumbnail = "regenerate-thumbnail",
    TranscodeVideo = "transcode-video"
}
export declare enum SourceType {
    MachineLearning = "machine-learning",
    Exif = "exif",
    Manual = "manual"
}
export declare enum AssetTypeEnum {
    Image = "IMAGE",
    Video = "VIDEO",
    Audio = "AUDIO",
    Other = "OTHER"
}
export declare enum AssetEditAction {
    Crop = "crop",
    Rotate = "rotate",
    Mirror = "mirror"
}
export declare enum MirrorAxis {
    Horizontal = "horizontal",
    Vertical = "vertical"
}
export declare enum AssetMediaSize {
    Original = "original",
    Fullsize = "fullsize",
    Preview = "preview",
    Thumbnail = "thumbnail"
}
export declare enum ManualJobName {
    PersonCleanup = "person-cleanup",
    TagCleanup = "tag-cleanup",
    UserCleanup = "user-cleanup",
    MemoryCleanup = "memory-cleanup",
    MemoryCreate = "memory-create",
    BackupDatabase = "backup-database"
}
export declare enum QueueName {
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
export declare enum QueueCommand {
    Start = "start",
    Pause = "pause",
    Resume = "resume",
    Empty = "empty",
    ClearFailed = "clear-failed"
}
export declare enum MemorySearchOrder {
    Asc = "asc",
    Desc = "desc",
    Random = "random"
}
export declare enum MemoryType {
    OnThisDay = "on_this_day"
}
export declare enum PartnerDirection {
    SharedBy = "shared-by",
    SharedWith = "shared-with"
}
export declare enum PluginJsonSchemaType {
    String = "string",
    Number = "number",
    Integer = "integer",
    Boolean = "boolean",
    Object = "object",
    Array = "array",
    Null = "null"
}
export declare enum PluginContextType {
    Asset = "asset",
    Album = "album",
    Person = "person"
}
export declare enum PluginTriggerType {
    AssetCreate = "AssetCreate",
    PersonRecognized = "PersonRecognized"
}
export declare enum QueueJobStatus {
    Active = "active",
    Failed = "failed",
    Completed = "completed",
    Delayed = "delayed",
    Waiting = "waiting",
    Paused = "paused"
}
export declare enum JobName {
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
export declare enum SearchSuggestionType {
    Country = "country",
    State = "state",
    City = "city",
    CameraMake = "camera-make",
    CameraModel = "camera-model",
    CameraLensModel = "camera-lens-model"
}
export declare enum SharedLinkType {
    Album = "ALBUM",
    Individual = "INDIVIDUAL"
}
export declare enum AssetIdErrorReason {
    Duplicate = "duplicate",
    NoPermission = "no_permission",
    NotFound = "not_found"
}
export declare enum SyncEntityType {
    AuthUserV1 = "AuthUserV1",
    UserV1 = "UserV1",
    UserDeleteV1 = "UserDeleteV1",
    AssetV1 = "AssetV1",
    AssetDeleteV1 = "AssetDeleteV1",
    AssetExifV1 = "AssetExifV1",
    AssetEditV1 = "AssetEditV1",
    AssetEditDeleteV1 = "AssetEditDeleteV1",
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
    AlbumV2 = "AlbumV2",
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
export declare enum SyncRequestType {
    AlbumsV1 = "AlbumsV1",
    AlbumsV2 = "AlbumsV2",
    AlbumUsersV1 = "AlbumUsersV1",
    AlbumToAssetsV1 = "AlbumToAssetsV1",
    AlbumAssetsV1 = "AlbumAssetsV1",
    AlbumAssetExifsV1 = "AlbumAssetExifsV1",
    AssetsV1 = "AssetsV1",
    AssetExifsV1 = "AssetExifsV1",
    AssetEditsV1 = "AssetEditsV1",
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
export declare enum TranscodeHWAccel {
    Nvenc = "nvenc",
    Qsv = "qsv",
    Vaapi = "vaapi",
    Rkmpp = "rkmpp",
    Disabled = "disabled"
}
export declare enum AudioCodec {
    Mp3 = "mp3",
    Aac = "aac",
    Libopus = "libopus",
    Opus = "opus",
    PcmS16Le = "pcm_s16le"
}
export declare enum VideoContainer {
    Mov = "mov",
    Mp4 = "mp4",
    Ogg = "ogg",
    Webm = "webm"
}
export declare enum VideoCodec {
    H264 = "h264",
    Hevc = "hevc",
    Vp9 = "vp9",
    Av1 = "av1"
}
export declare enum CQMode {
    Auto = "auto",
    Cqp = "cqp",
    Icq = "icq"
}
export declare enum ToneMapping {
    Hable = "hable",
    Mobius = "mobius",
    Reinhard = "reinhard",
    Disabled = "disabled"
}
export declare enum TranscodePolicy {
    All = "all",
    Optimal = "optimal",
    Bitrate = "bitrate",
    Required = "required",
    Disabled = "disabled"
}
export declare enum Colorspace {
    Srgb = "srgb",
    P3 = "p3"
}
export declare enum ImageFormat {
    Jpeg = "jpeg",
    Webp = "webp"
}
export declare enum LogLevel {
    Verbose = "verbose",
    Debug = "debug",
    Log = "log",
    Warn = "warn",
    Error = "error",
    Fatal = "fatal"
}
export declare enum OAuthTokenEndpointAuthMethod {
    ClientSecretPost = "client_secret_post",
    ClientSecretBasic = "client_secret_basic"
}
export declare enum UserMetadataKey {
    Preferences = "preferences",
    License = "license",
    Onboarding = "onboarding"
}
