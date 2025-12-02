/**
 * Immich
 * 2.3.1
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "/api",
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "/api"
};
export type UserResponseDto = {
    avatarColor: UserAvatarColor;
    email: string;
    id: string;
    name: string;
    profileChangedAt: string;
    profileImagePath: string;
};
export type ActivityResponseDto = {
    assetId: string | null;
    comment?: string | null;
    createdAt: string;
    id: string;
    "type": ReactionType;
    user: UserResponseDto;
};
export type ActivityCreateDto = {
    albumId: string;
    assetId?: string;
    comment?: string;
    "type": ReactionType;
};
export type ActivityStatisticsResponseDto = {
    comments: number;
    likes: number;
};
export type SetMaintenanceModeDto = {
    action: MaintenanceAction;
};
export type MaintenanceLoginDto = {
    token?: string;
};
export type MaintenanceAuthDto = {
    username: string;
};
export type NotificationCreateDto = {
    data?: object;
    description?: string | null;
    level?: NotificationLevel;
    readAt?: string | null;
    title: string;
    "type"?: NotificationType;
    userId: string;
};
export type NotificationDto = {
    createdAt: string;
    data?: object;
    description?: string;
    id: string;
    level: NotificationLevel;
    readAt?: string;
    title: string;
    "type": NotificationType;
};
export type TemplateDto = {
    template: string;
};
export type TemplateResponseDto = {
    html: string;
    name: string;
};
export type SystemConfigSmtpTransportDto = {
    host: string;
    ignoreCert: boolean;
    password: string;
    port: number;
    secure: boolean;
    username: string;
};
export type SystemConfigSmtpDto = {
    enabled: boolean;
    "from": string;
    replyTo: string;
    transport: SystemConfigSmtpTransportDto;
};
export type TestEmailResponseDto = {
    messageId: string;
};
export type UserLicense = {
    activatedAt: string;
    activationKey: string;
    licenseKey: string;
};
export type UserAdminResponseDto = {
    avatarColor: UserAvatarColor;
    createdAt: string;
    deletedAt: string | null;
    email: string;
    id: string;
    isAdmin: boolean;
    license: (UserLicense) | null;
    name: string;
    oauthId: string;
    profileChangedAt: string;
    profileImagePath: string;
    quotaSizeInBytes: number | null;
    quotaUsageInBytes: number | null;
    shouldChangePassword: boolean;
    status: UserStatus;
    storageLabel: string | null;
    updatedAt: string;
};
export type UserAdminCreateDto = {
    avatarColor?: (UserAvatarColor) | null;
    email: string;
    isAdmin?: boolean;
    name: string;
    notify?: boolean;
    password: string;
    quotaSizeInBytes?: number | null;
    shouldChangePassword?: boolean;
    storageLabel?: string | null;
};
export type UserAdminDeleteDto = {
    force?: boolean;
};
export type UserAdminUpdateDto = {
    avatarColor?: (UserAvatarColor) | null;
    email?: string;
    isAdmin?: boolean;
    name?: string;
    password?: string;
    pinCode?: string | null;
    quotaSizeInBytes?: number | null;
    shouldChangePassword?: boolean;
    storageLabel?: string | null;
};
export type AlbumsResponse = {
    defaultAssetOrder: AssetOrder;
};
export type CastResponse = {
    gCastEnabled: boolean;
};
export type DownloadResponse = {
    archiveSize: number;
    includeEmbeddedVideos: boolean;
};
export type EmailNotificationsResponse = {
    albumInvite: boolean;
    albumUpdate: boolean;
    enabled: boolean;
};
export type FoldersResponse = {
    enabled: boolean;
    sidebarWeb: boolean;
};
export type MemoriesResponse = {
    duration: number;
    enabled: boolean;
};
export type PeopleResponse = {
    enabled: boolean;
    sidebarWeb: boolean;
};
export type PurchaseResponse = {
    hideBuyButtonUntil: string;
    showSupportBadge: boolean;
};
export type RatingsResponse = {
    enabled: boolean;
};
export type SharedLinksResponse = {
    enabled: boolean;
    sidebarWeb: boolean;
};
export type TagsResponse = {
    enabled: boolean;
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
    gCastEnabled?: boolean;
};
export type DownloadUpdate = {
    archiveSize?: number;
    includeEmbeddedVideos?: boolean;
};
export type EmailNotificationsUpdate = {
    albumInvite?: boolean;
    albumUpdate?: boolean;
    enabled?: boolean;
};
export type FoldersUpdate = {
    enabled?: boolean;
    sidebarWeb?: boolean;
};
export type MemoriesUpdate = {
    duration?: number;
    enabled?: boolean;
};
export type PeopleUpdate = {
    enabled?: boolean;
    sidebarWeb?: boolean;
};
export type PurchaseUpdate = {
    hideBuyButtonUntil?: string;
    showSupportBadge?: boolean;
};
export type RatingsUpdate = {
    enabled?: boolean;
};
export type SharedLinksUpdate = {
    enabled?: boolean;
    sidebarWeb?: boolean;
};
export type TagsUpdate = {
    enabled?: boolean;
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
    appVersion: string | null;
    createdAt: string;
    current: boolean;
    deviceOS: string;
    deviceType: string;
    expiresAt?: string;
    id: string;
    isPendingSyncReset: boolean;
    updatedAt: string;
};
export type AssetStatsResponseDto = {
    images: number;
    total: number;
    videos: number;
};
export type AlbumUserResponseDto = {
    role: AlbumUserRole;
    user: UserResponseDto;
};
export type ExifResponseDto = {
    city?: string | null;
    country?: string | null;
    dateTimeOriginal?: string | null;
    description?: string | null;
    exifImageHeight?: number | null;
    exifImageWidth?: number | null;
    exposureTime?: string | null;
    fNumber?: number | null;
    fileSizeInByte?: number | null;
    focalLength?: number | null;
    iso?: number | null;
    latitude?: number | null;
    lensModel?: string | null;
    longitude?: number | null;
    make?: string | null;
    model?: string | null;
    modifyDate?: string | null;
    orientation?: string | null;
    projectionType?: string | null;
    rating?: number | null;
    state?: string | null;
    timeZone?: string | null;
};
export type AssetFaceWithoutPersonResponseDto = {
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    id: string;
    imageHeight: number;
    imageWidth: number;
    sourceType?: SourceType;
};
export type PersonWithFacesResponseDto = {
    birthDate: string | null;
    color?: string;
    faces: AssetFaceWithoutPersonResponseDto[];
    id: string;
    isFavorite?: boolean;
    isHidden: boolean;
    name: string;
    thumbnailPath: string;
    updatedAt?: string;
};
export type AssetStackResponseDto = {
    assetCount: number;
    id: string;
    primaryAssetId: string;
};
export type TagResponseDto = {
    color?: string;
    createdAt: string;
    id: string;
    name: string;
    parentId?: string;
    updatedAt: string;
    value: string;
};
export type AssetResponseDto = {
    /** base64 encoded sha1 hash */
    checksum: string;
    /** The UTC timestamp when the asset was originally uploaded to Immich. */
    createdAt: string;
    deviceAssetId: string;
    deviceId: string;
    duplicateId?: string | null;
    duration: string;
    exifInfo?: ExifResponseDto;
    /** The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken. */
    fileCreatedAt: string;
    /** The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken. */
    fileModifiedAt: string;
    hasMetadata: boolean;
    id: string;
    isArchived: boolean;
    isFavorite: boolean;
    isOffline: boolean;
    isTrashed: boolean;
    libraryId?: string | null;
    livePhotoVideoId?: string | null;
    /** The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by "local" days and months. */
    localDateTime: string;
    originalFileName: string;
    originalMimeType?: string;
    originalPath: string;
    owner?: UserResponseDto;
    ownerId: string;
    people?: PersonWithFacesResponseDto[];
    resized?: boolean;
    stack?: (AssetStackResponseDto) | null;
    tags?: TagResponseDto[];
    thumbhash: string | null;
    "type": AssetTypeEnum;
    unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
    /** The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified. */
    updatedAt: string;
    visibility: AssetVisibility;
};
export type ContributorCountResponseDto = {
    assetCount: number;
    userId: string;
};
export type AlbumResponseDto = {
    albumName: string;
    albumThumbnailAssetId: string | null;
    albumUsers: AlbumUserResponseDto[];
    assetCount: number;
    assets: AssetResponseDto[];
    contributorCounts?: ContributorCountResponseDto[];
    createdAt: string;
    description: string;
    endDate?: string;
    hasSharedLink: boolean;
    id: string;
    isActivityEnabled: boolean;
    lastModifiedAssetTimestamp?: string;
    order?: AssetOrder;
    owner: UserResponseDto;
    ownerId: string;
    shared: boolean;
    startDate?: string;
    updatedAt: string;
};
export type AlbumUserCreateDto = {
    role: AlbumUserRole;
    userId: string;
};
export type CreateAlbumDto = {
    albumName: string;
    albumUsers?: AlbumUserCreateDto[];
    assetIds?: string[];
    description?: string;
};
export type AlbumsAddAssetsDto = {
    albumIds: string[];
    assetIds: string[];
};
export type AlbumsAddAssetsResponseDto = {
    error?: BulkIdErrorReason;
    success: boolean;
};
export type AlbumStatisticsResponseDto = {
    notShared: number;
    owned: number;
    shared: number;
};
export type UpdateAlbumDto = {
    albumName?: string;
    albumThumbnailAssetId?: string;
    description?: string;
    isActivityEnabled?: boolean;
    order?: AssetOrder;
};
export type BulkIdsDto = {
    ids: string[];
};
export type BulkIdResponseDto = {
    error?: Error;
    id: string;
    success: boolean;
};
export type UpdateAlbumUserDto = {
    role: AlbumUserRole;
};
export type AlbumUserAddDto = {
    role?: AlbumUserRole;
    userId: string;
};
export type AddUsersDto = {
    albumUsers: AlbumUserAddDto[];
};
export type ApiKeyResponseDto = {
    createdAt: string;
    id: string;
    name: string;
    permissions: Permission[];
    updatedAt: string;
};
export type ApiKeyCreateDto = {
    name?: string;
    permissions: Permission[];
};
export type ApiKeyCreateResponseDto = {
    apiKey: ApiKeyResponseDto;
    secret: string;
};
export type ApiKeyUpdateDto = {
    name?: string;
    permissions?: Permission[];
};
export type AssetBulkDeleteDto = {
    force?: boolean;
    ids: string[];
};
export type AssetMetadataUpsertItemDto = {
    key: AssetMetadataKey;
    value: object;
};
export type AssetMediaCreateDto = {
    assetData: Blob;
    deviceAssetId: string;
    deviceId: string;
    duration?: string;
    fileCreatedAt: string;
    fileModifiedAt: string;
    filename?: string;
    isFavorite?: boolean;
    livePhotoVideoId?: string;
    metadata: AssetMetadataUpsertItemDto[];
    sidecarData?: Blob;
    visibility?: AssetVisibility;
};
export type AssetMediaResponseDto = {
    id: string;
    status: AssetMediaStatus;
};
export type AssetBulkUpdateDto = {
    dateTimeOriginal?: string;
    dateTimeRelative?: number;
    description?: string;
    duplicateId?: string | null;
    ids: string[];
    isFavorite?: boolean;
    latitude?: number;
    longitude?: number;
    rating?: number;
    timeZone?: string;
    visibility?: AssetVisibility;
};
export type AssetBulkUploadCheckItem = {
    /** base64 or hex encoded sha1 hash */
    checksum: string;
    id: string;
};
export type AssetBulkUploadCheckDto = {
    assets: AssetBulkUploadCheckItem[];
};
export type AssetBulkUploadCheckResult = {
    action: Action;
    assetId?: string;
    id: string;
    isTrashed?: boolean;
    reason?: Reason;
};
export type AssetBulkUploadCheckResponseDto = {
    results: AssetBulkUploadCheckResult[];
};
export type AssetCopyDto = {
    albums?: boolean;
    favorite?: boolean;
    sharedLinks?: boolean;
    sidecar?: boolean;
    sourceId: string;
    stack?: boolean;
    targetId: string;
};
export type CheckExistingAssetsDto = {
    deviceAssetIds: string[];
    deviceId: string;
};
export type CheckExistingAssetsResponseDto = {
    existingIds: string[];
};
export type AssetJobsDto = {
    assetIds: string[];
    name: AssetJobName;
};
export type UpdateAssetDto = {
    dateTimeOriginal?: string;
    description?: string;
    isFavorite?: boolean;
    latitude?: number;
    livePhotoVideoId?: string | null;
    longitude?: number;
    rating?: number;
    visibility?: AssetVisibility;
};
export type AssetMetadataResponseDto = {
    key: AssetMetadataKey;
    updatedAt: string;
    value: object;
};
export type AssetMetadataUpsertDto = {
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
    assetData: Blob;
    deviceAssetId: string;
    deviceId: string;
    duration?: string;
    fileCreatedAt: string;
    fileModifiedAt: string;
    filename?: string;
};
export type SignUpDto = {
    email: string;
    name: string;
    password: string;
};
export type ChangePasswordDto = {
    invalidateSessions?: boolean;
    newPassword: string;
    password: string;
};
export type LoginCredentialDto = {
    email: string;
    password: string;
};
export type LoginResponseDto = {
    accessToken: string;
    isAdmin: boolean;
    isOnboarded: boolean;
    name: string;
    profileImagePath: string;
    shouldChangePassword: boolean;
    userEmail: string;
    userId: string;
};
export type LogoutResponseDto = {
    redirectUri: string;
    successful: boolean;
};
export type PinCodeResetDto = {
    password?: string;
    pinCode?: string;
};
export type PinCodeSetupDto = {
    pinCode: string;
};
export type PinCodeChangeDto = {
    newPinCode: string;
    password?: string;
    pinCode?: string;
};
export type SessionUnlockDto = {
    password?: string;
    pinCode?: string;
};
export type AuthStatusResponseDto = {
    expiresAt?: string;
    isElevated: boolean;
    password: boolean;
    pinCode: boolean;
    pinExpiresAt?: string;
};
export type ValidateAccessTokenResponseDto = {
    authStatus: boolean;
};
export type AssetIdsDto = {
    assetIds: string[];
};
export type DownloadInfoDto = {
    albumId?: string;
    archiveSize?: number;
    assetIds?: string[];
    userId?: string;
};
export type DownloadArchiveInfo = {
    assetIds: string[];
    size: number;
};
export type DownloadResponseDto = {
    archives: DownloadArchiveInfo[];
    totalSize: number;
};
export type DuplicateResponseDto = {
    assets: AssetResponseDto[];
    duplicateId: string;
};
export type PersonResponseDto = {
    birthDate: string | null;
    color?: string;
    id: string;
    isFavorite?: boolean;
    isHidden: boolean;
    name: string;
    thumbnailPath: string;
    updatedAt?: string;
};
export type AssetFaceResponseDto = {
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    id: string;
    imageHeight: number;
    imageWidth: number;
    person: (PersonResponseDto) | null;
    sourceType?: SourceType;
};
export type AssetFaceCreateDto = {
    assetId: string;
    height: number;
    imageHeight: number;
    imageWidth: number;
    personId: string;
    width: number;
    x: number;
    y: number;
};
export type AssetFaceDeleteDto = {
    force: boolean;
};
export type FaceDto = {
    id: string;
};
export type QueueStatisticsDto = {
    active: number;
    completed: number;
    delayed: number;
    failed: number;
    paused: number;
    waiting: number;
};
export type QueueStatusLegacyDto = {
    isActive: boolean;
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
    force?: boolean;
};
export type LibraryResponseDto = {
    assetCount: number;
    createdAt: string;
    exclusionPatterns: string[];
    id: string;
    importPaths: string[];
    name: string;
    ownerId: string;
    refreshedAt: string | null;
    updatedAt: string;
};
export type CreateLibraryDto = {
    exclusionPatterns?: string[];
    importPaths?: string[];
    name?: string;
    ownerId: string;
};
export type UpdateLibraryDto = {
    exclusionPatterns?: string[];
    importPaths?: string[];
    name?: string;
};
export type LibraryStatsResponseDto = {
    photos: number;
    total: number;
    usage: number;
    videos: number;
};
export type ValidateLibraryDto = {
    exclusionPatterns?: string[];
    importPaths?: string[];
};
export type ValidateLibraryImportPathResponseDto = {
    importPath: string;
    isValid: boolean;
    message?: string;
};
export type ValidateLibraryResponseDto = {
    importPaths?: ValidateLibraryImportPathResponseDto[];
};
export type MapMarkerResponseDto = {
    city: string | null;
    country: string | null;
    id: string;
    lat: number;
    lon: number;
    state: string | null;
};
export type MapReverseGeocodeResponseDto = {
    city: string | null;
    country: string | null;
    state: string | null;
};
export type OnThisDayDto = {
    year: number;
};
export type MemoryResponseDto = {
    assets: AssetResponseDto[];
    createdAt: string;
    data: OnThisDayDto;
    deletedAt?: string;
    hideAt?: string;
    id: string;
    isSaved: boolean;
    memoryAt: string;
    ownerId: string;
    seenAt?: string;
    showAt?: string;
    "type": MemoryType;
    updatedAt: string;
};
export type MemoryCreateDto = {
    assetIds?: string[];
    data: OnThisDayDto;
    isSaved?: boolean;
    memoryAt: string;
    seenAt?: string;
    "type": MemoryType;
};
export type MemoryStatisticsResponseDto = {
    total: number;
};
export type MemoryUpdateDto = {
    isSaved?: boolean;
    memoryAt?: string;
    seenAt?: string;
};
export type NotificationDeleteAllDto = {
    ids: string[];
};
export type NotificationUpdateAllDto = {
    ids: string[];
    readAt?: string | null;
};
export type NotificationUpdateDto = {
    readAt?: string | null;
};
export type OAuthConfigDto = {
    codeChallenge?: string;
    redirectUri: string;
    state?: string;
};
export type OAuthAuthorizeResponseDto = {
    url: string;
};
export type OAuthCallbackDto = {
    codeVerifier?: string;
    state?: string;
    url: string;
};
export type PartnerResponseDto = {
    avatarColor: UserAvatarColor;
    email: string;
    id: string;
    inTimeline?: boolean;
    name: string;
    profileChangedAt: string;
    profileImagePath: string;
};
export type PartnerCreateDto = {
    sharedWithId: string;
};
export type PartnerUpdateDto = {
    inTimeline: boolean;
};
export type PeopleResponseDto = {
    hasNextPage?: boolean;
    hidden: number;
    people: PersonResponseDto[];
    total: number;
};
export type PersonCreateDto = {
    /** Person date of birth.
    Note: the mobile app cannot currently set the birth date to null. */
    birthDate?: string | null;
    color?: string | null;
    isFavorite?: boolean;
    /** Person visibility */
    isHidden?: boolean;
    /** Person name. */
    name?: string;
};
export type PeopleUpdateItem = {
    /** Person date of birth.
    Note: the mobile app cannot currently set the birth date to null. */
    birthDate?: string | null;
    color?: string | null;
    /** Asset is used to get the feature face thumbnail. */
    featureFaceAssetId?: string;
    /** Person id. */
    id: string;
    isFavorite?: boolean;
    /** Person visibility */
    isHidden?: boolean;
    /** Person name. */
    name?: string;
};
export type PeopleUpdateDto = {
    people: PeopleUpdateItem[];
};
export type PersonUpdateDto = {
    /** Person date of birth.
    Note: the mobile app cannot currently set the birth date to null. */
    birthDate?: string | null;
    color?: string | null;
    /** Asset is used to get the feature face thumbnail. */
    featureFaceAssetId?: string;
    isFavorite?: boolean;
    /** Person visibility */
    isHidden?: boolean;
    /** Person name. */
    name?: string;
};
export type MergePersonDto = {
    ids: string[];
};
export type AssetFaceUpdateItem = {
    assetId: string;
    personId: string;
};
export type AssetFaceUpdateDto = {
    data: AssetFaceUpdateItem[];
};
export type PersonStatisticsResponseDto = {
    assets: number;
};
export type PluginActionResponseDto = {
    description: string;
    id: string;
    methodName: string;
    pluginId: string;
    schema: object | null;
    supportedContexts: PluginContextType[];
    title: string;
};
export type PluginFilterResponseDto = {
    description: string;
    id: string;
    methodName: string;
    pluginId: string;
    schema: object | null;
    supportedContexts: PluginContextType[];
    title: string;
};
export type PluginResponseDto = {
    actions: PluginActionResponseDto[];
    author: string;
    createdAt: string;
    description: string;
    filters: PluginFilterResponseDto[];
    id: string;
    name: string;
    title: string;
    updatedAt: string;
    version: string;
};
export type PluginTriggerResponseDto = {
    contextType: PluginContextType;
    description: string;
    name: string;
    "type": PluginTriggerType;
};
export type QueueResponseDto = {
    isPaused: boolean;
    name: QueueName;
    statistics: QueueStatisticsDto;
};
export type QueueUpdateDto = {
    isPaused?: boolean;
};
export type QueueDeleteDto = {
    /** If true, will also remove failed jobs from the queue. */
    failed?: boolean;
};
export type QueueJobResponseDto = {
    data: object;
    id?: string;
    name: JobName;
    timestamp: number;
};
export type SearchExploreItem = {
    data: AssetResponseDto;
    value: string;
};
export type SearchExploreResponseDto = {
    fieldName: string;
    items: SearchExploreItem[];
};
export type MetadataSearchDto = {
    albumIds?: string[];
    checksum?: string;
    city?: string | null;
    country?: string | null;
    createdAfter?: string;
    createdBefore?: string;
    description?: string;
    deviceAssetId?: string;
    deviceId?: string;
    encodedVideoPath?: string;
    id?: string;
    isEncoded?: boolean;
    isFavorite?: boolean;
    isMotion?: boolean;
    isNotInAlbum?: boolean;
    isOffline?: boolean;
    lensModel?: string | null;
    libraryId?: string | null;
    make?: string;
    model?: string | null;
    ocr?: string;
    order?: AssetOrder;
    originalFileName?: string;
    originalPath?: string;
    page?: number;
    personIds?: string[];
    previewPath?: string;
    rating?: number;
    size?: number;
    state?: string | null;
    tagIds?: string[] | null;
    takenAfter?: string;
    takenBefore?: string;
    thumbnailPath?: string;
    trashedAfter?: string;
    trashedBefore?: string;
    "type"?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    visibility?: AssetVisibility;
    withDeleted?: boolean;
    withExif?: boolean;
    withPeople?: boolean;
    withStacked?: boolean;
};
export type SearchFacetCountResponseDto = {
    count: number;
    value: string;
};
export type SearchFacetResponseDto = {
    counts: SearchFacetCountResponseDto[];
    fieldName: string;
};
export type SearchAlbumResponseDto = {
    count: number;
    facets: SearchFacetResponseDto[];
    items: AlbumResponseDto[];
    total: number;
};
export type SearchAssetResponseDto = {
    count: number;
    facets: SearchFacetResponseDto[];
    items: AssetResponseDto[];
    nextPage: string | null;
    total: number;
};
export type SearchResponseDto = {
    albums: SearchAlbumResponseDto;
    assets: SearchAssetResponseDto;
};
export type PlacesResponseDto = {
    admin1name?: string;
    admin2name?: string;
    latitude: number;
    longitude: number;
    name: string;
};
export type RandomSearchDto = {
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
    "type"?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    visibility?: AssetVisibility;
    withDeleted?: boolean;
    withExif?: boolean;
    withPeople?: boolean;
    withStacked?: boolean;
};
export type SmartSearchDto = {
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
    language?: string;
    lensModel?: string | null;
    libraryId?: string | null;
    make?: string;
    model?: string | null;
    ocr?: string;
    page?: number;
    personIds?: string[];
    query?: string;
    queryAssetId?: string;
    rating?: number;
    size?: number;
    state?: string | null;
    tagIds?: string[] | null;
    takenAfter?: string;
    takenBefore?: string;
    trashedAfter?: string;
    trashedBefore?: string;
    "type"?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    visibility?: AssetVisibility;
    withDeleted?: boolean;
    withExif?: boolean;
};
export type StatisticsSearchDto = {
    albumIds?: string[];
    city?: string | null;
    country?: string | null;
    createdAfter?: string;
    createdBefore?: string;
    description?: string;
    deviceId?: string;
    isEncoded?: boolean;
    isFavorite?: boolean;
    isMotion?: boolean;
    isNotInAlbum?: boolean;
    isOffline?: boolean;
    lensModel?: string | null;
    libraryId?: string | null;
    make?: string;
    model?: string | null;
    ocr?: string;
    personIds?: string[];
    rating?: number;
    state?: string | null;
    tagIds?: string[] | null;
    takenAfter?: string;
    takenBefore?: string;
    trashedAfter?: string;
    trashedBefore?: string;
    "type"?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    visibility?: AssetVisibility;
};
export type SearchStatisticsResponseDto = {
    total: number;
};
export type ServerAboutResponseDto = {
    build?: string;
    buildImage?: string;
    buildImageUrl?: string;
    buildUrl?: string;
    exiftool?: string;
    ffmpeg?: string;
    imagemagick?: string;
    libvips?: string;
    licensed: boolean;
    nodejs?: string;
    repository?: string;
    repositoryUrl?: string;
    sourceCommit?: string;
    sourceRef?: string;
    sourceUrl?: string;
    thirdPartyBugFeatureUrl?: string;
    thirdPartyDocumentationUrl?: string;
    thirdPartySourceUrl?: string;
    thirdPartySupportUrl?: string;
    version: string;
    versionUrl: string;
};
export type ServerApkLinksDto = {
    arm64v8a: string;
    armeabiv7a: string;
    universal: string;
    x86_64: string;
};
export type ServerConfigDto = {
    externalDomain: string;
    isInitialized: boolean;
    isOnboarded: boolean;
    loginPageMessage: string;
    maintenanceMode: boolean;
    mapDarkStyleUrl: string;
    mapLightStyleUrl: string;
    oauthButtonText: string;
    publicUsers: boolean;
    trashDays: number;
    userDeleteDelay: number;
};
export type ServerFeaturesDto = {
    configFile: boolean;
    duplicateDetection: boolean;
    email: boolean;
    facialRecognition: boolean;
    importFaces: boolean;
    map: boolean;
    oauth: boolean;
    oauthAutoLaunch: boolean;
    ocr: boolean;
    passwordLogin: boolean;
    reverseGeocoding: boolean;
    search: boolean;
    sidecar: boolean;
    smartSearch: boolean;
    trash: boolean;
};
export type LicenseResponseDto = {
    activatedAt: string;
    activationKey: string;
    licenseKey: string;
};
export type LicenseKeyDto = {
    activationKey: string;
    licenseKey: string;
};
export type ServerMediaTypesResponseDto = {
    image: string[];
    sidecar: string[];
    video: string[];
};
export type ServerPingResponse = {};
export type ServerPingResponseRead = {
    res: string;
};
export type UsageByUserDto = {
    photos: number;
    quotaSizeInBytes: number | null;
    usage: number;
    usagePhotos: number;
    usageVideos: number;
    userId: string;
    userName: string;
    videos: number;
};
export type ServerStatsResponseDto = {
    photos: number;
    usage: number;
    usageByUser: UsageByUserDto[];
    usagePhotos: number;
    usageVideos: number;
    videos: number;
};
export type ServerStorageResponseDto = {
    diskAvailable: string;
    diskAvailableRaw: number;
    diskSize: string;
    diskSizeRaw: number;
    diskUsagePercentage: number;
    diskUse: string;
    diskUseRaw: number;
};
export type ServerThemeDto = {
    customCss: string;
};
export type ServerVersionResponseDto = {
    major: number;
    minor: number;
    patch: number;
};
export type VersionCheckStateResponseDto = {
    checkedAt: string | null;
    releaseVersion: string | null;
};
export type ServerVersionHistoryResponseDto = {
    createdAt: string;
    id: string;
    version: string;
};
export type SessionCreateDto = {
    deviceOS?: string;
    deviceType?: string;
    /** session duration, in seconds */
    duration?: number;
};
export type SessionCreateResponseDto = {
    appVersion: string | null;
    createdAt: string;
    current: boolean;
    deviceOS: string;
    deviceType: string;
    expiresAt?: string;
    id: string;
    isPendingSyncReset: boolean;
    token: string;
    updatedAt: string;
};
export type SessionUpdateDto = {
    isPendingSyncReset?: boolean;
};
export type SharedLinkResponseDto = {
    album?: AlbumResponseDto;
    allowDownload: boolean;
    allowUpload: boolean;
    assets: AssetResponseDto[];
    createdAt: string;
    description: string | null;
    expiresAt: string | null;
    id: string;
    key: string;
    password: string | null;
    showMetadata: boolean;
    slug: string | null;
    token?: string | null;
    "type": SharedLinkType;
    userId: string;
};
export type SharedLinkCreateDto = {
    albumId?: string;
    allowDownload?: boolean;
    allowUpload?: boolean;
    assetIds?: string[];
    description?: string | null;
    expiresAt?: string | null;
    password?: string | null;
    showMetadata?: boolean;
    slug?: string | null;
    "type": SharedLinkType;
};
export type SharedLinkEditDto = {
    allowDownload?: boolean;
    allowUpload?: boolean;
    /** Few clients cannot send null to set the expiryTime to never.
    Setting this flag and not sending expiryAt is considered as null instead.
    Clients that can send null values can ignore this. */
    changeExpiryTime?: boolean;
    description?: string | null;
    expiresAt?: string | null;
    password?: string | null;
    showMetadata?: boolean;
    slug?: string | null;
};
export type AssetIdsResponseDto = {
    assetId: string;
    error?: Error2;
    success: boolean;
};
export type StackResponseDto = {
    assets: AssetResponseDto[];
    id: string;
    primaryAssetId: string;
};
export type StackCreateDto = {
    /** first asset becomes the primary */
    assetIds: string[];
};
export type StackUpdateDto = {
    primaryAssetId?: string;
};
export type SyncAckDeleteDto = {
    types?: SyncEntityType[];
};
export type SyncAckDto = {
    ack: string;
    "type": SyncEntityType;
};
export type SyncAckSetDto = {
    acks: string[];
};
export type AssetDeltaSyncDto = {
    updatedAfter: string;
    userIds: string[];
};
export type AssetDeltaSyncResponseDto = {
    deleted: string[];
    needsFullSync: boolean;
    upserted: AssetResponseDto[];
};
export type AssetFullSyncDto = {
    lastId?: string;
    limit: number;
    updatedUntil: string;
    userId?: string;
};
export type SyncStreamDto = {
    reset?: boolean;
    types: SyncRequestType[];
};
export type DatabaseBackupConfig = {
    cronExpression: string;
    enabled: boolean;
    keepLastAmount: number;
};
export type SystemConfigBackupsDto = {
    database: DatabaseBackupConfig;
};
export type SystemConfigFFmpegDto = {
    accel: TranscodeHWAccel;
    accelDecode: boolean;
    acceptedAudioCodecs: AudioCodec[];
    acceptedContainers: VideoContainer[];
    acceptedVideoCodecs: VideoCodec[];
    bframes: number;
    cqMode: CQMode;
    crf: number;
    gopSize: number;
    maxBitrate: string;
    preferredHwDevice: string;
    preset: string;
    refs: number;
    targetAudioCodec: AudioCodec;
    targetResolution: string;
    targetVideoCodec: VideoCodec;
    temporalAQ: boolean;
    threads: number;
    tonemap: ToneMapping;
    transcode: TranscodePolicy;
    twoPass: boolean;
};
export type SystemConfigGeneratedFullsizeImageDto = {
    enabled: boolean;
    format: ImageFormat;
    quality: number;
};
export type SystemConfigGeneratedImageDto = {
    format: ImageFormat;
    quality: number;
    size: number;
};
export type SystemConfigImageDto = {
    colorspace: Colorspace;
    extractEmbedded: boolean;
    fullsize: SystemConfigGeneratedFullsizeImageDto;
    preview: SystemConfigGeneratedImageDto;
    thumbnail: SystemConfigGeneratedImageDto;
};
export type JobSettingsDto = {
    concurrency: number;
};
export type SystemConfigJobDto = {
    backgroundTask: JobSettingsDto;
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
    enabled: boolean;
};
export type SystemConfigLibraryWatchDto = {
    enabled: boolean;
};
export type SystemConfigLibraryDto = {
    scan: SystemConfigLibraryScanDto;
    watch: SystemConfigLibraryWatchDto;
};
export type SystemConfigLoggingDto = {
    enabled: boolean;
    level: LogLevel;
};
export type MachineLearningAvailabilityChecksDto = {
    enabled: boolean;
    interval: number;
    timeout: number;
};
export type ClipConfig = {
    enabled: boolean;
    modelName: string;
};
export type DuplicateDetectionConfig = {
    enabled: boolean;
    maxDistance: number;
};
export type FacialRecognitionConfig = {
    enabled: boolean;
    maxDistance: number;
    minFaces: number;
    minScore: number;
    modelName: string;
};
export type OcrConfig = {
    enabled: boolean;
    maxResolution: number;
    minDetectionScore: number;
    minRecognitionScore: number;
    modelName: string;
};
export type SystemConfigMachineLearningDto = {
    availabilityChecks: MachineLearningAvailabilityChecksDto;
    clip: ClipConfig;
    duplicateDetection: DuplicateDetectionConfig;
    enabled: boolean;
    facialRecognition: FacialRecognitionConfig;
    ocr: OcrConfig;
    urls: string[];
};
export type SystemConfigMapDto = {
    darkStyle: string;
    enabled: boolean;
    lightStyle: string;
};
export type SystemConfigFacesDto = {
    "import": boolean;
};
export type SystemConfigMetadataDto = {
    faces: SystemConfigFacesDto;
};
export type SystemConfigNewVersionCheckDto = {
    enabled: boolean;
};
export type SystemConfigNightlyTasksDto = {
    clusterNewFaces: boolean;
    databaseCleanup: boolean;
    generateMemories: boolean;
    missingThumbnails: boolean;
    startTime: string;
    syncQuotaUsage: boolean;
};
export type SystemConfigNotificationsDto = {
    smtp: SystemConfigSmtpDto;
};
export type SystemConfigOAuthDto = {
    autoLaunch: boolean;
    autoRegister: boolean;
    buttonText: string;
    clientId: string;
    clientSecret: string;
    defaultStorageQuota: number | null;
    enabled: boolean;
    issuerUrl: string;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
    profileSigningAlgorithm: string;
    roleClaim: string;
    scope: string;
    signingAlgorithm: string;
    storageLabelClaim: string;
    storageQuotaClaim: string;
    timeout: number;
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod;
};
export type SystemConfigPasswordLoginDto = {
    enabled: boolean;
};
export type SystemConfigReverseGeocodingDto = {
    enabled: boolean;
};
export type SystemConfigServerDto = {
    externalDomain: string;
    loginPageMessage: string;
    publicUsers: boolean;
};
export type SystemConfigStorageTemplateDto = {
    enabled: boolean;
    hashVerificationEnabled: boolean;
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
    customCss: string;
};
export type SystemConfigTrashDto = {
    days: number;
    enabled: boolean;
};
export type SystemConfigUserDto = {
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
    dayOptions: string[];
    hourOptions: string[];
    minuteOptions: string[];
    monthOptions: string[];
    presetOptions: string[];
    secondOptions: string[];
    weekOptions: string[];
    yearOptions: string[];
};
export type AdminOnboardingUpdateDto = {
    isOnboarded: boolean;
};
export type ReverseGeocodingStateResponseDto = {
    lastImportFileName: string | null;
    lastUpdate: string | null;
};
export type TagCreateDto = {
    color?: string;
    name: string;
    parentId?: string | null;
};
export type TagUpsertDto = {
    tags: string[];
};
export type TagBulkAssetsDto = {
    assetIds: string[];
    tagIds: string[];
};
export type TagBulkAssetsResponseDto = {
    count: number;
};
export type TagUpdateDto = {
    color?: string | null;
};
export type TimeBucketAssetResponseDto = {
    /** Array of city names extracted from EXIF GPS data */
    city: (string | null)[];
    /** Array of country names extracted from EXIF GPS data */
    country: (string | null)[];
    /** Array of video durations in HH:MM:SS format (null for images) */
    duration: (string | null)[];
    /** Array of file creation timestamps in UTC (ISO 8601 format, without timezone) */
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
    count: number;
};
export type UserUpdateMeDto = {
    avatarColor?: (UserAvatarColor) | null;
    email?: string;
    name?: string;
    password?: string;
};
export type OnboardingResponseDto = {
    isOnboarded: boolean;
};
export type OnboardingDto = {
    isOnboarded: boolean;
};
export type CreateProfileImageDto = {
    file: Blob;
};
export type CreateProfileImageResponseDto = {
    profileChangedAt: string;
    profileImagePath: string;
    userId: string;
};
export type WorkflowActionResponseDto = {
    actionConfig: object | null;
    id: string;
    order: number;
    pluginActionId: string;
    workflowId: string;
};
export type WorkflowFilterResponseDto = {
    filterConfig: object | null;
    id: string;
    order: number;
    pluginFilterId: string;
    workflowId: string;
};
export type WorkflowResponseDto = {
    actions: WorkflowActionResponseDto[];
    createdAt: string;
    description: string;
    enabled: boolean;
    filters: WorkflowFilterResponseDto[];
    id: string;
    name: string | null;
    ownerId: string;
    triggerType: PluginTriggerType;
};
export type WorkflowActionItemDto = {
    actionConfig?: object;
    pluginActionId: string;
};
export type WorkflowFilterItemDto = {
    filterConfig?: object;
    pluginFilterId: string;
};
export type WorkflowCreateDto = {
    actions: WorkflowActionItemDto[];
    description?: string;
    enabled?: boolean;
    filters: WorkflowFilterItemDto[];
    name: string;
    triggerType: PluginTriggerType;
};
export type WorkflowUpdateDto = {
    actions?: WorkflowActionItemDto[];
    description?: string;
    enabled?: boolean;
    filters?: WorkflowFilterItemDto[];
    name?: string;
    triggerType?: PluginTriggerType;
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
    key: AssetMetadataKey;
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
    key: AssetMetadataKey;
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
export function downloadAsset({ id, key, slug }: {
    id: string;
    key?: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
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
export function viewAsset({ id, key, size, slug }: {
    id: string;
    key?: string;
    size?: AssetMediaSize;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/thumbnail${QS.query(QS.explode({
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
export function downloadArchive({ key, slug, assetIdsDto }: {
    key?: string;
    slug?: string;
    assetIdsDto: AssetIdsDto;
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
        body: assetIdsDto
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
export function getAllSharedLinks({ albumId }: {
    albumId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto[];
    }>(`/shared-links${QS.query(QS.explode({
        albumId
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
    End = "end"
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
    DuplicateRead = "duplicate.read",
    DuplicateDelete = "duplicate.delete",
    FaceCreate = "face.create",
    FaceRead = "face.read",
    FaceUpdate = "face.update",
    FaceDelete = "face.delete",
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
export enum AssetMetadataKey {
    MobileApp = "mobile-app"
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
export enum AssetMediaSize {
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
    Workflow = "workflow"
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
