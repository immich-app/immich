/**
 * Immich
 * 1.94.1
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "oazapfts/lib/runtime";
import * as QS from "oazapfts/lib/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "/api",
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "/api"
};
export type ReactionLevel = "album" | "asset";
export type ReactionType = "comment" | "like";
export type UserAvatarColor = "primary" | "pink" | "red" | "yellow" | "blue" | "green" | "purple" | "orange" | "gray" | "amber";
export type UserDto = {
    avatarColor: UserAvatarColor;
    email: string;
    id: string;
    name: string;
    profileImagePath: string;
};
export type ActivityResponseDto = {
    assetId: string | null;
    comment?: string | null;
    createdAt: string;
    id: string;
    "type": "comment" | "like";
    user: UserDto;
};
export type ActivityCreateDto = {
    albumId: string;
    assetId?: string;
    comment?: string;
    "type": ReactionType;
};
export type ActivityStatisticsResponseDto = {
    comments: number;
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
    state?: string | null;
    timeZone?: string | null;
};
export type UserResponseDto = {
    avatarColor: UserAvatarColor;
    createdAt: string;
    deletedAt: string | null;
    email: string;
    externalPath: string | null;
    id: string;
    isAdmin: boolean;
    memoriesEnabled?: boolean;
    name: string;
    oauthId: string;
    profileImagePath: string;
    quotaSizeInBytes: number | null;
    quotaUsageInBytes: number | null;
    shouldChangePassword: boolean;
    storageLabel: string | null;
    updatedAt: string;
};
export type AssetFaceWithoutPersonResponseDto = {
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    id: string;
    imageHeight: number;
    imageWidth: number;
};
export type PersonWithFacesResponseDto = {
    birthDate: string | null;
    faces: AssetFaceWithoutPersonResponseDto[];
    id: string;
    isHidden: boolean;
    name: string;
    thumbnailPath: string;
};
export type SmartInfoResponseDto = {
    objects?: string[] | null;
    tags?: string[] | null;
};
export type TagTypeEnum = "OBJECT" | "FACE" | "CUSTOM";
export type TagResponseDto = {
    id: string;
    name: string;
    "type": TagTypeEnum;
    userId: string;
};
export type AssetTypeEnum = "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
export type AssetResponseDto = {
    /** base64 encoded sha1 hash */
    checksum: string;
    deviceAssetId: string;
    deviceId: string;
    duration: string;
    exifInfo?: ExifResponseDto;
    fileCreatedAt: string;
    fileModifiedAt: string;
    hasMetadata: boolean;
    id: string;
    isArchived: boolean;
    isExternal: boolean;
    isFavorite: boolean;
    isOffline: boolean;
    isReadOnly: boolean;
    isTrashed: boolean;
    libraryId: string;
    livePhotoVideoId?: string | null;
    localDateTime: string;
    originalFileName: string;
    originalPath: string;
    owner?: UserResponseDto;
    ownerId: string;
    people?: PersonWithFacesResponseDto[];
    resized: boolean;
    smartInfo?: SmartInfoResponseDto;
    stack?: AssetResponseDto[];
    stackCount: number | null;
    stackParentId?: string | null;
    tags?: TagResponseDto[];
    thumbhash: string | null;
    "type": AssetTypeEnum;
    updatedAt: string;
};
export type AlbumResponseDto = {
    albumName: string;
    albumThumbnailAssetId: string | null;
    assetCount: number;
    assets: AssetResponseDto[];
    createdAt: string;
    description: string;
    endDate?: string;
    hasSharedLink: boolean;
    id: string;
    isActivityEnabled: boolean;
    lastModifiedAssetTimestamp?: string;
    owner: UserResponseDto;
    ownerId: string;
    shared: boolean;
    sharedUsers: UserResponseDto[];
    startDate?: string;
    updatedAt: string;
};
export type CreateAlbumDto = {
    albumName: string;
    assetIds?: string[];
    description?: string;
    sharedWithUserIds?: string[];
};
export type AlbumCountResponseDto = {
    notShared: number;
    owned: number;
    shared: number;
};
export type UpdateAlbumDto = {
    albumName?: string;
    albumThumbnailAssetId?: string;
    description?: string;
    isActivityEnabled?: boolean;
};
export type BulkIdsDto = {
    ids: string[];
};
export type BulkIdResponseDto = {
    error?: "duplicate" | "no_permission" | "not_found" | "unknown";
    id: string;
    success: boolean;
};
export type AddUsersDto = {
    sharedUserIds: string[];
};
export type ApiKeyResponseDto = {
    createdAt: string;
    id: string;
    name: string;
    updatedAt: string;
};
export type ApiKeyCreateDto = {
    name?: string;
};
export type ApiKeyCreateResponseDto = {
    apiKey: ApiKeyResponseDto;
    secret: string;
};
export type ApiKeyUpdateDto = {
    name: string;
};
export type AssetBulkDeleteDto = {
    force?: boolean;
    ids: string[];
};
export type AssetBulkUpdateDto = {
    dateTimeOriginal?: string;
    ids: string[];
    isArchived?: boolean;
    isFavorite?: boolean;
    latitude?: number;
    longitude?: number;
    removeParent?: boolean;
    stackParentId?: string;
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
    action: "accept" | "reject";
    assetId?: string;
    id: string;
    reason?: "duplicate" | "unsupported-format";
};
export type AssetBulkUploadCheckResponseDto = {
    results: AssetBulkUploadCheckResult[];
};
export type CuratedLocationsResponseDto = {
    city: string;
    deviceAssetId: string;
    deviceId: string;
    id: string;
    resizePath: string;
};
export type CuratedObjectsResponseDto = {
    deviceAssetId: string;
    deviceId: string;
    id: string;
    "object": string;
    resizePath: string;
};
export type CheckExistingAssetsDto = {
    deviceAssetIds: string[];
    deviceId: string;
};
export type CheckExistingAssetsResponseDto = {
    existingIds: string[];
};
export type AssetJobName = "regenerate-thumbnail" | "refresh-metadata" | "transcode-video";
export type AssetJobsDto = {
    assetIds: string[];
    name: AssetJobName;
};
export type MapMarkerResponseDto = {
    id: string;
    lat: number;
    lon: number;
};
export type MemoryLaneResponseDto = {
    assets: AssetResponseDto[];
    title: string;
};
export type UpdateStackParentDto = {
    newParentId: string;
    oldParentId: string;
};
export type AssetStatsResponseDto = {
    images: number;
    total: number;
    videos: number;
};
export type ThumbnailFormat = "JPEG" | "WEBP";
export type TimeBucketSize = "DAY" | "MONTH";
export type TimeBucketResponseDto = {
    count: number;
    timeBucket: string;
};
export type CreateAssetDto = {
    assetData: Blob;
    deviceAssetId: string;
    deviceId: string;
    duration?: string;
    fileCreatedAt: string;
    fileModifiedAt: string;
    isArchived?: boolean;
    isExternal?: boolean;
    isFavorite?: boolean;
    isOffline?: boolean;
    isReadOnly?: boolean;
    isVisible?: boolean;
    libraryId?: string;
    livePhotoData?: Blob;
    sidecarData?: Blob;
};
export type AssetFileUploadResponseDto = {
    duplicate: boolean;
    id: string;
};
export type UpdateAssetDto = {
    dateTimeOriginal?: string;
    description?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    latitude?: number;
    longitude?: number;
};
export type AssetOrder = "asc" | "desc";
export type EntityType = "ASSET" | "ALBUM";
export type AuditDeletesResponseDto = {
    ids: string[];
    needsFullSync: boolean;
};
export type PathEntityType = "asset" | "person" | "user";
export type PathType = "original" | "jpeg_thumbnail" | "webp_thumbnail" | "encoded_video" | "sidecar" | "face" | "profile";
export type FileReportItemDto = {
    checksum?: string;
    entityId: string;
    entityType: PathEntityType;
    pathType: PathType;
    pathValue: string;
};
export type FileReportDto = {
    extras: string[];
    orphans: FileReportItemDto[];
};
export type FileChecksumDto = {
    filenames: string[];
};
export type FileChecksumResponseDto = {
    checksum: string;
    filename: string;
};
export type FileReportFixDto = {
    items: FileReportItemDto[];
};
export type SignUpDto = {
    email: string;
    name: string;
    password: string;
};
export type ChangePasswordDto = {
    newPassword: string;
    password: string;
};
export type AuthDeviceResponseDto = {
    createdAt: string;
    current: boolean;
    deviceOS: string;
    deviceType: string;
    id: string;
    updatedAt: string;
};
export type LoginCredentialDto = {
    email: string;
    password: string;
};
export type LoginResponseDto = {
    accessToken: string;
    isAdmin: boolean;
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
export type PersonResponseDto = {
    birthDate: string | null;
    id: string;
    isHidden: boolean;
    name: string;
    thumbnailPath: string;
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
};
export type FaceDto = {
    id: string;
};
export type JobCountsDto = {
    active: number;
    completed: number;
    delayed: number;
    failed: number;
    paused: number;
    waiting: number;
};
export type QueueStatusDto = {
    isActive: boolean;
    isPaused: boolean;
};
export type JobStatusDto = {
    jobCounts: JobCountsDto;
    queueStatus: QueueStatusDto;
};
export type AllJobStatusResponseDto = {
    backgroundTask: JobStatusDto;
    faceDetection: JobStatusDto;
    facialRecognition: JobStatusDto;
    library: JobStatusDto;
    metadataExtraction: JobStatusDto;
    migration: JobStatusDto;
    search: JobStatusDto;
    sidecar: JobStatusDto;
    smartSearch: JobStatusDto;
    storageTemplateMigration: JobStatusDto;
    thumbnailGeneration: JobStatusDto;
    videoConversion: JobStatusDto;
};
export type JobName = "thumbnailGeneration" | "metadataExtraction" | "videoConversion" | "faceDetection" | "facialRecognition" | "smartSearch" | "backgroundTask" | "storageTemplateMigration" | "migration" | "search" | "sidecar" | "library";
export type JobCommand = "start" | "pause" | "resume" | "empty" | "clear-failed";
export type JobCommandDto = {
    command: JobCommand;
    force: boolean;
};
export type LibraryType = "UPLOAD" | "EXTERNAL";
export type LibraryResponseDto = {
    assetCount: number;
    createdAt: string;
    exclusionPatterns: string[];
    id: string;
    importPaths: string[];
    name: string;
    ownerId: string;
    refreshedAt: string | null;
    "type": LibraryType;
    updatedAt: string;
};
export type CreateLibraryDto = {
    exclusionPatterns?: string[];
    importPaths?: string[];
    isVisible?: boolean;
    isWatched?: boolean;
    name?: string;
    "type": LibraryType;
};
export type UpdateLibraryDto = {
    exclusionPatterns?: string[];
    importPaths?: string[];
    isVisible?: boolean;
    name?: string;
};
export type ScanLibraryDto = {
    refreshAllFiles?: boolean;
    refreshModifiedFiles?: boolean;
};
export type LibraryStatsResponseDto = {
    photos: number;
    total: number;
    usage: number;
    videos: number;
};
export type OAuthConfigDto = {
    redirectUri: string;
};
export type OAuthAuthorizeResponseDto = {
    url: string;
};
export type OAuthCallbackDto = {
    url: string;
};
export type PartnerResponseDto = {
    avatarColor: UserAvatarColor;
    createdAt: string;
    deletedAt: string | null;
    email: string;
    externalPath: string | null;
    id: string;
    inTimeline?: boolean;
    isAdmin: boolean;
    memoriesEnabled?: boolean;
    name: string;
    oauthId: string;
    profileImagePath: string;
    quotaSizeInBytes: number | null;
    quotaUsageInBytes: number | null;
    shouldChangePassword: boolean;
    storageLabel: string | null;
    updatedAt: string;
};
export type UpdatePartnerDto = {
    inTimeline: boolean;
};
export type PeopleResponseDto = {
    people: PersonResponseDto[];
    total: number;
};
export type PeopleUpdateItem = {
    /** Person date of birth.
    Note: the mobile app cannot currently set the birth date to null. */
    birthDate?: string | null;
    /** Asset is used to get the feature face thumbnail. */
    featureFaceAssetId?: string;
    /** Person id. */
    id: string;
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
    /** Asset is used to get the feature face thumbnail. */
    featureFaceAssetId?: string;
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
    total: number;
};
export type SearchResponseDto = {
    albums: SearchAlbumResponseDto;
    assets: SearchAssetResponseDto;
};
export type SearchExploreItem = {
    data: AssetResponseDto;
    value: string;
};
export type SearchExploreResponseDto = {
    fieldName: string;
    items: SearchExploreItem[];
};
export type ServerInfoResponseDto = {
    diskAvailable: string;
    diskAvailableRaw: number;
    diskSize: string;
    diskSizeRaw: number;
    diskUsagePercentage: number;
    diskUse: string;
    diskUseRaw: number;
};
export type ServerConfigDto = {
    externalDomain: string;
    isInitialized: boolean;
    isOnboarded: boolean;
    loginPageMessage: string;
    oauthButtonText: string;
    trashDays: number;
};
export type ServerFeaturesDto = {
    configFile: boolean;
    facialRecognition: boolean;
    map: boolean;
    oauth: boolean;
    oauthAutoLaunch: boolean;
    passwordLogin: boolean;
    reverseGeocoding: boolean;
    search: boolean;
    sidecar: boolean;
    smartSearch: boolean;
    trash: boolean;
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
    userId: string;
    userName: string;
    videos: number;
};
export type ServerStatsResponseDto = {
    photos: number;
    usage: number;
    usageByUser: UsageByUserDto[];
    videos: number;
};
export type ServerThemeDto = {
    customCss: string;
};
export type ServerVersionResponseDto = {
    major: number;
    minor: number;
    patch: number;
};
export type SharedLinkType = "ALBUM" | "INDIVIDUAL";
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
    token?: string | null;
    "type": SharedLinkType;
    userId: string;
};
export type SharedLinkCreateDto = {
    albumId?: string;
    allowDownload?: boolean;
    allowUpload?: boolean;
    assetIds?: string[];
    description?: string;
    expiresAt?: string | null;
    password?: string;
    showMetadata?: boolean;
    "type": SharedLinkType;
};
export type SharedLinkEditDto = {
    allowDownload?: boolean;
    allowUpload?: boolean;
    /** Few clients cannot send null to set the expiryTime to never.
    Setting this flag and not sending expiryAt is considered as null instead.
    Clients that can send null values can ignore this. */
    changeExpiryTime?: boolean;
    description?: string;
    expiresAt?: string | null;
    password?: string;
    showMetadata?: boolean;
};
export type AssetIdsResponseDto = {
    assetId: string;
    error?: "duplicate" | "no_permission" | "not_found";
    success: boolean;
};
export type TranscodeHwAccel = "nvenc" | "qsv" | "vaapi" | "rkmpp" | "disabled";
export type AudioCodec = "mp3" | "aac" | "libopus";
export type VideoCodec = "h264" | "hevc" | "vp9";
export type CqMode = "auto" | "cqp" | "icq";
export type ToneMapping = "hable" | "mobius" | "reinhard" | "disabled";
export type TranscodePolicy = "all" | "optimal" | "bitrate" | "required" | "disabled";
export type SystemConfigFFmpegDto = {
    accel: TranscodeHwAccel;
    acceptedAudioCodecs: AudioCodec[];
    acceptedVideoCodecs: VideoCodec[];
    bframes: number;
    cqMode: CqMode;
    crf: number;
    gopSize: number;
    maxBitrate: string;
    npl: number;
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
export type JobSettingsDto = {
    concurrency: number;
};
export type SystemConfigJobDto = {
    backgroundTask: JobSettingsDto;
    faceDetection: JobSettingsDto;
    library: JobSettingsDto;
    metadataExtraction: JobSettingsDto;
    migration: JobSettingsDto;
    search: JobSettingsDto;
    sidecar: JobSettingsDto;
    smartSearch: JobSettingsDto;
    thumbnailGeneration: JobSettingsDto;
    videoConversion: JobSettingsDto;
};
export type SystemConfigLibraryScanDto = {
    cronExpression: string;
    enabled: boolean;
};
export type SystemConfigLibraryWatchDto = {
    enabled: boolean;
    interval: number;
    usePolling: boolean;
};
export type SystemConfigLibraryDto = {
    scan: SystemConfigLibraryScanDto;
    watch: SystemConfigLibraryWatchDto;
};
export type LogLevel = "verbose" | "debug" | "log" | "warn" | "error" | "fatal";
export type SystemConfigLoggingDto = {
    enabled: boolean;
    level: LogLevel;
};
export type ClipMode = "vision" | "text";
export type ModelType = "facial-recognition" | "clip";
export type ClipConfig = {
    enabled: boolean;
    mode?: ClipMode;
    modelName: string;
    modelType?: ModelType;
};
export type RecognitionConfig = {
    enabled: boolean;
    maxDistance: number;
    minFaces: number;
    minScore: number;
    modelName: string;
    modelType?: ModelType;
};
export type SystemConfigMachineLearningDto = {
    clip: ClipConfig;
    enabled: boolean;
    facialRecognition: RecognitionConfig;
    url: string;
};
export type SystemConfigMapDto = {
    darkStyle: string;
    enabled: boolean;
    lightStyle: string;
};
export type SystemConfigNewVersionCheckDto = {
    enabled: boolean;
};
export type SystemConfigOAuthDto = {
    autoLaunch: boolean;
    autoRegister: boolean;
    buttonText: string;
    clientId: string;
    clientSecret: string;
    enabled: boolean;
    issuerUrl: string;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
    scope: string;
    signingAlgorithm: string;
    storageLabelClaim: string;
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
};
export type SystemConfigStorageTemplateDto = {
    enabled: boolean;
    hashVerificationEnabled: boolean;
    template: string;
};
export type SystemConfigThemeDto = {
    customCss: string;
};
export type Colorspace = "srgb" | "p3";
export type SystemConfigThumbnailDto = {
    colorspace: Colorspace;
    jpegSize: number;
    quality: number;
    webpSize: number;
};
export type SystemConfigTrashDto = {
    days: number;
    enabled: boolean;
};
export type SystemConfigDto = {
    ffmpeg: SystemConfigFFmpegDto;
    job: SystemConfigJobDto;
    library: SystemConfigLibraryDto;
    logging: SystemConfigLoggingDto;
    machineLearning: SystemConfigMachineLearningDto;
    map: SystemConfigMapDto;
    newVersionCheck: SystemConfigNewVersionCheckDto;
    oauth: SystemConfigOAuthDto;
    passwordLogin: SystemConfigPasswordLoginDto;
    reverseGeocoding: SystemConfigReverseGeocodingDto;
    server: SystemConfigServerDto;
    storageTemplate: SystemConfigStorageTemplateDto;
    theme: SystemConfigThemeDto;
    thumbnail: SystemConfigThumbnailDto;
    trash: SystemConfigTrashDto;
};
export type MapTheme = "light" | "dark";
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
export type CreateTagDto = {
    name: string;
    "type": TagTypeEnum;
};
export type UpdateTagDto = {
    name?: string;
};
export type CreateUserDto = {
    email: string;
    externalPath?: string | null;
    memoriesEnabled?: boolean;
    name: string;
    password: string;
    quotaSizeInBytes?: number | null;
    storageLabel?: string | null;
};
export type UpdateUserDto = {
    avatarColor?: UserAvatarColor;
    email?: string;
    externalPath?: string;
    id: string;
    isAdmin?: boolean;
    memoriesEnabled?: boolean;
    name?: string;
    password?: string;
    quotaSizeInBytes?: number | null;
    shouldChangePassword?: boolean;
    storageLabel?: string;
};
export type CreateProfileImageDto = {
    file: Blob;
};
export type CreateProfileImageResponseDto = {
    profileImagePath: string;
    userId: string;
};
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
    }>(`/activity${QS.query(QS.explode({
        albumId,
        assetId,
        level,
        "type": $type,
        userId
    }))}`, {
        ...opts
    }));
}
export function createActivity({ activityCreateDto }: {
    activityCreateDto: ActivityCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: ActivityResponseDto;
    }>("/activity", oazapfts.json({
        ...opts,
        method: "POST",
        body: activityCreateDto
    })));
}
export function getActivityStatistics({ albumId, assetId }: {
    albumId: string;
    assetId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ActivityStatisticsResponseDto;
    }>(`/activity/statistics${QS.query(QS.explode({
        albumId,
        assetId
    }))}`, {
        ...opts
    }));
}
export function deleteActivity({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/activity/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getAllAlbums({ assetId, shared }: {
    assetId?: string;
    shared?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto[];
    }>(`/album${QS.query(QS.explode({
        assetId,
        shared
    }))}`, {
        ...opts
    }));
}
export function createAlbum({ createAlbumDto }: {
    createAlbumDto: CreateAlbumDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: AlbumResponseDto;
    }>("/album", oazapfts.json({
        ...opts,
        method: "POST",
        body: createAlbumDto
    })));
}
export function getAlbumCount(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumCountResponseDto;
    }>("/album/count", {
        ...opts
    }));
}
export function deleteAlbum({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/album/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getAlbumInfo({ id, key, withoutAssets }: {
    id: string;
    key?: string;
    withoutAssets?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/album/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        withoutAssets
    }))}`, {
        ...opts
    }));
}
export function updateAlbumInfo({ id, updateAlbumDto }: {
    id: string;
    updateAlbumDto: UpdateAlbumDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/album/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: updateAlbumDto
    })));
}
export function removeAssetFromAlbum({ id, bulkIdsDto }: {
    id: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/album/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
export function addAssetsToAlbum({ id, key, bulkIdsDto }: {
    id: string;
    key?: string;
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>(`/album/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
export function removeUserFromAlbum({ id, userId }: {
    id: string;
    userId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/album/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function addUsersToAlbum({ id, addUsersDto }: {
    id: string;
    addUsersDto: AddUsersDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/album/${encodeURIComponent(id)}/users`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: addUsersDto
    })));
}
export function getApiKeys(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto[];
    }>("/api-key", {
        ...opts
    }));
}
export function createApiKey({ apiKeyCreateDto }: {
    apiKeyCreateDto: ApiKeyCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: ApiKeyCreateResponseDto;
    }>("/api-key", oazapfts.json({
        ...opts,
        method: "POST",
        body: apiKeyCreateDto
    })));
}
export function deleteApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/api-key/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getApiKey({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto;
    }>(`/api-key/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function updateApiKey({ id, apiKeyUpdateDto }: {
    id: string;
    apiKeyUpdateDto: ApiKeyUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ApiKeyResponseDto;
    }>(`/api-key/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: apiKeyUpdateDto
    })));
}
export function deleteAssets({ assetBulkDeleteDto }: {
    assetBulkDeleteDto: AssetBulkDeleteDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/asset", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetBulkDeleteDto
    })));
}
/**
 * Get all AssetEntity belong to the user
 */
export function getAllAssets({ ifNoneMatch, isArchived, isFavorite, skip, take, updatedAfter, updatedBefore, userId }: {
    ifNoneMatch?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    skip?: number;
    take?: number;
    updatedAfter?: string;
    updatedBefore?: string;
    userId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/asset${QS.query(QS.explode({
        isArchived,
        isFavorite,
        skip,
        take,
        updatedAfter,
        updatedBefore,
        userId
    }))}`, {
        ...opts,
        headers: oazapfts.mergeHeaders(opts?.headers, {
            "if-none-match": ifNoneMatch
        })
    }));
}
export function updateAssets({ assetBulkUpdateDto }: {
    assetBulkUpdateDto: AssetBulkUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/asset", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetBulkUpdateDto
    })));
}
/**
 * Checks if assets exist by checksums
 */
export function checkBulkUpload({ assetBulkUploadCheckDto }: {
    assetBulkUploadCheckDto: AssetBulkUploadCheckDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetBulkUploadCheckResponseDto;
    }>("/asset/bulk-upload-check", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetBulkUploadCheckDto
    })));
}
export function getCuratedLocations(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: CuratedLocationsResponseDto[];
    }>("/asset/curated-locations", {
        ...opts
    }));
}
export function getCuratedObjects(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: CuratedObjectsResponseDto[];
    }>("/asset/curated-objects", {
        ...opts
    }));
}
/**
 * Get all asset of a device that are in the database, ID only.
 */
export function getAllUserAssetsByDeviceId({ deviceId }: {
    deviceId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>(`/asset/device/${encodeURIComponent(deviceId)}`, {
        ...opts
    }));
}
/**
 * Checks if multiple assets exist on the server and returns all existing - used by background backup
 */
export function checkExistingAssets({ checkExistingAssetsDto }: {
    checkExistingAssetsDto: CheckExistingAssetsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: CheckExistingAssetsResponseDto;
    }>("/asset/exist", oazapfts.json({
        ...opts,
        method: "POST",
        body: checkExistingAssetsDto
    })));
}
export function serveFile({ id, isThumb, isWeb, key }: {
    id: string;
    isThumb?: boolean;
    isWeb?: boolean;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/asset/file/${encodeURIComponent(id)}${QS.query(QS.explode({
        isThumb,
        isWeb,
        key
    }))}`, {
        ...opts
    }));
}
export function runAssetJobs({ assetJobsDto }: {
    assetJobsDto: AssetJobsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/asset/jobs", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetJobsDto
    })));
}
export function getMapMarkers({ fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite }: {
    fileCreatedAfter?: string;
    fileCreatedBefore?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MapMarkerResponseDto[];
    }>(`/asset/map-marker${QS.query(QS.explode({
        fileCreatedAfter,
        fileCreatedBefore,
        isArchived,
        isFavorite
    }))}`, {
        ...opts
    }));
}
export function getMemoryLane({ day, month }: {
    day: number;
    month: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemoryLaneResponseDto[];
    }>(`/asset/memory-lane${QS.query(QS.explode({
        day,
        month
    }))}`, {
        ...opts
    }));
}
export function getRandom({ count }: {
    count?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/asset/random${QS.query(QS.explode({
        count
    }))}`, {
        ...opts
    }));
}
export function getAssetSearchTerms(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>("/asset/search-terms", {
        ...opts
    }));
}
export function updateStackParent({ updateStackParentDto }: {
    updateStackParentDto: UpdateStackParentDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/asset/stack/parent", oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateStackParentDto
    })));
}
export function getAssetStatistics({ isArchived, isFavorite, isTrashed }: {
    isArchived?: boolean;
    isFavorite?: boolean;
    isTrashed?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetStatsResponseDto;
    }>(`/asset/statistics${QS.query(QS.explode({
        isArchived,
        isFavorite,
        isTrashed
    }))}`, {
        ...opts
    }));
}
export function getAssetThumbnail({ format, id, key }: {
    format?: ThumbnailFormat;
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/asset/thumbnail/${encodeURIComponent(id)}${QS.query(QS.explode({
        format,
        key
    }))}`, {
        ...opts
    }));
}
export function getTimeBucket({ albumId, isArchived, isFavorite, isTrashed, key, personId, size, timeBucket, userId, withPartners, withStacked }: {
    albumId?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    personId?: string;
    size: TimeBucketSize;
    timeBucket: string;
    userId?: string;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/asset/time-bucket${QS.query(QS.explode({
        albumId,
        isArchived,
        isFavorite,
        isTrashed,
        key,
        personId,
        size,
        timeBucket,
        userId,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
export function getTimeBuckets({ albumId, isArchived, isFavorite, isTrashed, key, personId, size, userId, withPartners, withStacked }: {
    albumId?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    personId?: string;
    size: TimeBucketSize;
    userId?: string;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TimeBucketResponseDto[];
    }>(`/asset/time-buckets${QS.query(QS.explode({
        albumId,
        isArchived,
        isFavorite,
        isTrashed,
        key,
        personId,
        size,
        userId,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
export function uploadFile({ key, createAssetDto }: {
    key?: string;
    createAssetDto: CreateAssetDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: AssetFileUploadResponseDto;
    }>(`/asset/upload${QS.query(QS.explode({
        key
    }))}`, oazapfts.multipart({
        ...opts,
        method: "POST",
        body: createAssetDto
    })));
}
export function getAssetInfo({ id, key }: {
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto;
    }>(`/asset/${encodeURIComponent(id)}${QS.query(QS.explode({
        key
    }))}`, {
        ...opts
    }));
}
export function updateAsset({ id, updateAssetDto }: {
    id: string;
    updateAssetDto: UpdateAssetDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto;
    }>(`/asset/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateAssetDto
    })));
}
export function searchAssets({ checksum, city, country, createdAfter, createdBefore, deviceAssetId, deviceId, encodedVideoPath, id, isArchived, isEncoded, isExternal, isFavorite, isMotion, isOffline, isReadOnly, isVisible, lensModel, libraryId, make, model, order, originalFileName, originalPath, page, resizePath, size, state, takenAfter, takenBefore, trashedAfter, trashedBefore, $type, updatedAfter, updatedBefore, webpPath, withDeleted, withExif, withPeople, withStacked }: {
    checksum?: string;
    city?: string;
    country?: string;
    createdAfter?: string;
    createdBefore?: string;
    deviceAssetId?: string;
    deviceId?: string;
    encodedVideoPath?: string;
    id?: string;
    isArchived?: boolean;
    isEncoded?: boolean;
    isExternal?: boolean;
    isFavorite?: boolean;
    isMotion?: boolean;
    isOffline?: boolean;
    isReadOnly?: boolean;
    isVisible?: boolean;
    lensModel?: string;
    libraryId?: string;
    make?: string;
    model?: string;
    order?: AssetOrder;
    originalFileName?: string;
    originalPath?: string;
    page?: number;
    resizePath?: string;
    size?: number;
    state?: string;
    takenAfter?: string;
    takenBefore?: string;
    trashedAfter?: string;
    trashedBefore?: string;
    $type?: AssetTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    webpPath?: string;
    withDeleted?: boolean;
    withExif?: boolean;
    withPeople?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/assets${QS.query(QS.explode({
        checksum,
        city,
        country,
        createdAfter,
        createdBefore,
        deviceAssetId,
        deviceId,
        encodedVideoPath,
        id,
        isArchived,
        isEncoded,
        isExternal,
        isFavorite,
        isMotion,
        isOffline,
        isReadOnly,
        isVisible,
        lensModel,
        libraryId,
        make,
        model,
        order,
        originalFileName,
        originalPath,
        page,
        resizePath,
        size,
        state,
        takenAfter,
        takenBefore,
        trashedAfter,
        trashedBefore,
        "type": $type,
        updatedAfter,
        updatedBefore,
        webpPath,
        withDeleted,
        withExif,
        withPeople,
        withStacked
    }))}`, {
        ...opts
    }));
}
export function getAuditDeletes({ after, entityType, userId }: {
    after: string;
    entityType: EntityType;
    userId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AuditDeletesResponseDto;
    }>(`/audit/deletes${QS.query(QS.explode({
        after,
        entityType,
        userId
    }))}`, {
        ...opts
    }));
}
export function getAuditFiles(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: FileReportDto;
    }>("/audit/file-report", {
        ...opts
    }));
}
export function getFileChecksums({ fileChecksumDto }: {
    fileChecksumDto: FileChecksumDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: FileChecksumResponseDto[];
    }>("/audit/file-report/checksum", oazapfts.json({
        ...opts,
        method: "POST",
        body: fileChecksumDto
    })));
}
export function fixAuditFiles({ fileReportFixDto }: {
    fileReportFixDto: FileReportFixDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/audit/file-report/fix", oazapfts.json({
        ...opts,
        method: "POST",
        body: fileReportFixDto
    })));
}
export function signUpAdmin({ signUpDto }: {
    signUpDto: SignUpDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserResponseDto;
    }>("/auth/admin-sign-up", oazapfts.json({
        ...opts,
        method: "POST",
        body: signUpDto
    })));
}
export function changePassword({ changePasswordDto }: {
    changePasswordDto: ChangePasswordDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>("/auth/change-password", oazapfts.json({
        ...opts,
        method: "POST",
        body: changePasswordDto
    })));
}
export function logoutAuthDevices(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/devices", {
        ...opts,
        method: "DELETE"
    }));
}
export function getAuthDevices(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AuthDeviceResponseDto[];
    }>("/auth/devices", {
        ...opts
    }));
}
export function logoutAuthDevice({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/auth/devices/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
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
export function logout(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LogoutResponseDto;
    }>("/auth/logout", {
        ...opts,
        method: "POST"
    }));
}
export function validateAccessToken(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ValidateAccessTokenResponseDto;
    }>("/auth/validateToken", {
        ...opts,
        method: "POST"
    }));
}
export function downloadArchive({ key, assetIdsDto }: {
    key?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/download/archive${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: assetIdsDto
    })));
}
export function downloadFile({ id, key }: {
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/download/asset/${encodeURIComponent(id)}${QS.query(QS.explode({
        key
    }))}`, {
        ...opts,
        method: "POST"
    }));
}
export function getDownloadInfo({ key, downloadInfoDto }: {
    key?: string;
    downloadInfoDto: DownloadInfoDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: DownloadResponseDto;
    }>(`/download/info${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: downloadInfoDto
    })));
}
export function getFaces({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetFaceResponseDto[];
    }>(`/face${QS.query(QS.explode({
        id
    }))}`, {
        ...opts
    }));
}
export function reassignFacesById({ id, faceDto }: {
    id: string;
    faceDto: FaceDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/face/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: faceDto
    })));
}
export function getAllJobsStatus(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AllJobStatusResponseDto;
    }>("/jobs", {
        ...opts
    }));
}
export function sendJobCommand({ id, jobCommandDto }: {
    id: JobName;
    jobCommandDto: JobCommandDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: JobStatusDto;
    }>(`/jobs/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: jobCommandDto
    })));
}
export function getLibraries(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto[];
    }>("/library", {
        ...opts
    }));
}
export function createLibrary({ createLibraryDto }: {
    createLibraryDto: CreateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: LibraryResponseDto;
    }>("/library", oazapfts.json({
        ...opts,
        method: "POST",
        body: createLibraryDto
    })));
}
export function deleteLibrary({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/library/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getLibraryInfo({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto;
    }>(`/library/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function updateLibrary({ id, updateLibraryDto }: {
    id: string;
    updateLibraryDto: UpdateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryResponseDto;
    }>(`/library/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateLibraryDto
    })));
}
export function removeOfflineFiles({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/library/${encodeURIComponent(id)}/removeOffline`, {
        ...opts,
        method: "POST"
    }));
}
export function scanLibrary({ id, scanLibraryDto }: {
    id: string;
    scanLibraryDto: ScanLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/library/${encodeURIComponent(id)}/scan`, oazapfts.json({
        ...opts,
        method: "POST",
        body: scanLibraryDto
    })));
}
export function getLibraryStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LibraryStatsResponseDto;
    }>(`/library/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
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
export function linkOAuthAccount({ oAuthCallbackDto }: {
    oAuthCallbackDto: OAuthCallbackDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserResponseDto;
    }>("/oauth/link", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthCallbackDto
    })));
}
export function redirectOAuthToMobile(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/oauth/mobile-redirect", {
        ...opts
    }));
}
export function unlinkOAuthAccount(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserResponseDto;
    }>("/oauth/unlink", {
        ...opts,
        method: "POST"
    }));
}
export function getPartners({ direction }: {
    direction: "shared-by" | "shared-with";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PartnerResponseDto[];
    }>(`/partner${QS.query(QS.explode({
        direction
    }))}`, {
        ...opts
    }));
}
export function removePartner({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/partner/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function createPartner({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: PartnerResponseDto;
    }>(`/partner/${encodeURIComponent(id)}`, {
        ...opts,
        method: "POST"
    }));
}
export function updatePartner({ id, updatePartnerDto }: {
    id: string;
    updatePartnerDto: UpdatePartnerDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PartnerResponseDto;
    }>(`/partner/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updatePartnerDto
    })));
}
export function getAllPeople({ withHidden }: {
    withHidden?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PeopleResponseDto;
    }>(`/person${QS.query(QS.explode({
        withHidden
    }))}`, {
        ...opts
    }));
}
export function createPerson(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: PersonResponseDto;
    }>("/person", {
        ...opts,
        method: "POST"
    }));
}
export function updatePeople({ peopleUpdateDto }: {
    peopleUpdateDto: PeopleUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: BulkIdResponseDto[];
    }>("/person", oazapfts.json({
        ...opts,
        method: "PUT",
        body: peopleUpdateDto
    })));
}
export function getPerson({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/person/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function updatePerson({ id, personUpdateDto }: {
    id: string;
    personUpdateDto: PersonUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto;
    }>(`/person/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: personUpdateDto
    })));
}
export function getPersonAssets({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/person/${encodeURIComponent(id)}/assets`, {
        ...opts
    }));
}
export function mergePerson({ id, mergePersonDto }: {
    id: string;
    mergePersonDto: MergePersonDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: BulkIdResponseDto[];
    }>(`/person/${encodeURIComponent(id)}/merge`, oazapfts.json({
        ...opts,
        method: "POST",
        body: mergePersonDto
    })));
}
export function reassignFaces({ id, assetFaceUpdateDto }: {
    id: string;
    assetFaceUpdateDto: AssetFaceUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonResponseDto[];
    }>(`/person/${encodeURIComponent(id)}/reassign`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetFaceUpdateDto
    })));
}
export function getPersonStatistics({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: PersonStatisticsResponseDto;
    }>(`/person/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
export function getPersonThumbnail({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/person/${encodeURIComponent(id)}/thumbnail`, {
        ...opts
    }));
}
export function search({ clip, motion, q, query, recent, smart, $type, withArchived }: {
    clip?: boolean;
    motion?: boolean;
    q?: string;
    query?: string;
    recent?: boolean;
    smart?: boolean;
    $type?: "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
    withArchived?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchResponseDto;
    }>(`/search${QS.query(QS.explode({
        clip,
        motion,
        q,
        query,
        recent,
        smart,
        "type": $type,
        withArchived
    }))}`, {
        ...opts
    }));
}
export function getExploreData(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchExploreResponseDto[];
    }>("/search/explore", {
        ...opts
    }));
}
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
export function getServerInfo(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerInfoResponseDto;
    }>("/server-info", {
        ...opts
    }));
}
export function setAdminOnboarding(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server-info/admin-onboarding", {
        ...opts,
        method: "POST"
    }));
}
export function getServerConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerConfigDto;
    }>("/server-info/config", {
        ...opts
    }));
}
export function getServerFeatures(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerFeaturesDto;
    }>("/server-info/features", {
        ...opts
    }));
}
export function getSupportedMediaTypes(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerMediaTypesResponseDto;
    }>("/server-info/media-types", {
        ...opts
    }));
}
export function pingServer(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerPingResponseRead;
    }>("/server-info/ping", {
        ...opts
    }));
}
export function getServerStatistics(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerStatsResponseDto;
    }>("/server-info/statistics", {
        ...opts
    }));
}
export function getTheme(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerThemeDto;
    }>("/server-info/theme", {
        ...opts
    }));
}
export function getServerVersion(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerVersionResponseDto;
    }>("/server-info/version", {
        ...opts
    }));
}
export function getAllSharedLinks(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto[];
    }>("/shared-link", {
        ...opts
    }));
}
export function createSharedLink({ sharedLinkCreateDto }: {
    sharedLinkCreateDto: SharedLinkCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: SharedLinkResponseDto;
    }>("/shared-link", oazapfts.json({
        ...opts,
        method: "POST",
        body: sharedLinkCreateDto
    })));
}
export function getMySharedLink({ key, password, token }: {
    key?: string;
    password?: string;
    token?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-link/me${QS.query(QS.explode({
        key,
        password,
        token
    }))}`, {
        ...opts
    }));
}
export function removeSharedLink({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/shared-link/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getSharedLinkById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-link/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function updateSharedLink({ id, sharedLinkEditDto }: {
    id: string;
    sharedLinkEditDto: SharedLinkEditDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-link/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: sharedLinkEditDto
    })));
}
export function removeSharedLinkAssets({ id, key, assetIdsDto }: {
    id: string;
    key?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/shared-link/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetIdsDto
    })));
}
export function addSharedLinkAssets({ id, key, assetIdsDto }: {
    id: string;
    key?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/shared-link/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetIdsDto
    })));
}
export function getConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigDto;
    }>("/system-config", {
        ...opts
    }));
}
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
export function getConfigDefaults(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigDto;
    }>("/system-config/defaults", {
        ...opts
    }));
}
export function getMapStyle({ theme }: {
    theme: MapTheme;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: object;
    }>(`/system-config/map/style.json${QS.query(QS.explode({
        theme
    }))}`, {
        ...opts
    }));
}
export function getStorageTemplateOptions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SystemConfigTemplateStorageOptionDto;
    }>("/system-config/storage-template-options", {
        ...opts
    }));
}
export function getAllTags(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto[];
    }>("/tag", {
        ...opts
    }));
}
export function createTag({ createTagDto }: {
    createTagDto: CreateTagDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: TagResponseDto;
    }>("/tag", oazapfts.json({
        ...opts,
        method: "POST",
        body: createTagDto
    })));
}
export function deleteTag({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/tag/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function getTagById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto;
    }>(`/tag/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function updateTag({ id, updateTagDto }: {
    id: string;
    updateTagDto: UpdateTagDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TagResponseDto;
    }>(`/tag/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: updateTagDto
    })));
}
export function untagAssets({ id, assetIdsDto }: {
    id: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/tag/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetIdsDto
    })));
}
export function getTagAssets({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/tag/${encodeURIComponent(id)}/assets`, {
        ...opts
    }));
}
export function tagAssets({ id, assetIdsDto }: {
    id: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetIdsResponseDto[];
    }>(`/tag/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetIdsDto
    })));
}
export function emptyTrash(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/trash/empty", {
        ...opts,
        method: "POST"
    }));
}
export function restoreTrash(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/trash/restore", {
        ...opts,
        method: "POST"
    }));
}
export function restoreAssets({ bulkIdsDto }: {
    bulkIdsDto: BulkIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/trash/restore/assets", oazapfts.json({
        ...opts,
        method: "POST",
        body: bulkIdsDto
    })));
}
export function getAllUsers({ isAll }: {
    isAll: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto[];
    }>(`/user${QS.query(QS.explode({
        isAll
    }))}`, {
        ...opts
    }));
}
export function createUser({ createUserDto }: {
    createUserDto: CreateUserDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserResponseDto;
    }>("/user", oazapfts.json({
        ...opts,
        method: "POST",
        body: createUserDto
    })));
}
export function updateUser({ updateUserDto }: {
    updateUserDto: UpdateUserDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>("/user", oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateUserDto
    })));
}
export function getUserById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>(`/user/info/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function getMyUserInfo(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>("/user/me", {
        ...opts
    }));
}
export function deleteProfileImage(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/user/profile-image", {
        ...opts,
        method: "DELETE"
    }));
}
export function createProfileImage({ createProfileImageDto }: {
    createProfileImageDto: CreateProfileImageDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: CreateProfileImageResponseDto;
    }>("/user/profile-image", oazapfts.multipart({
        ...opts,
        method: "POST",
        body: createProfileImageDto
    })));
}
export function getProfileImage({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/user/profile-image/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function deleteUser({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserResponseDto;
    }>(`/user/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
export function restoreUser({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: UserResponseDto;
    }>(`/user/${encodeURIComponent(id)}/restore`, {
        ...opts,
        method: "POST"
    }));
}
