/**
 * Immich
 * 2.2.3
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
export type ActivityCreateDto = {
    albumId: string;
    assetId: string;
    "type": ReactionType;
};
export type SetMaintenanceModeDto = {
    maintenanceMode: boolean;
};
export type MaintenanceLoginDto = {
    token?: string;
};
export type NotificationCreateDto = {
    level: NotificationLevel;
    readAt: object;
    "type": NotificationType;
    userId: string;
};
export type TemplateDto = {};
export type SystemConfigSmtpDto = {
    enabled: boolean;
};
export type UserAdminCreateDto = {
    avatarColor: UserAvatarColor;
    isAdmin: boolean;
    notify: boolean;
    quotaSizeInBytes: number;
    shouldChangePassword: boolean;
};
export type UserAdminDeleteDto = {
    force: boolean;
};
export type UserAdminUpdateDto = {
    avatarColor: UserAvatarColor;
    isAdmin: boolean;
    pinCode: object;
    quotaSizeInBytes: number;
    shouldChangePassword: boolean;
};
export type UserPreferencesUpdateDto = {};
export type CreateAlbumDto = {
    albumName: string;
    assetIds: string[];
};
export type AlbumsAddAssetsDto = {
    albumIds: string[];
    assetIds: string[];
};
export type UpdateAlbumDto = {
    albumThumbnailAssetId: string;
    isActivityEnabled: boolean;
    order: AssetOrder;
};
export type BulkIdsDto = {
    ids: string[];
};
export type UpdateAlbumUserDto = {
    role: AlbumUserRole;
};
export type AddUsersDto = {};
export type ApiKeyCreateDto = {
    permissions: Permission[];
};
export type ApiKeyUpdateDto = {
    permissions: Permission[];
};
export type AssetBulkDeleteDto = {
    force: boolean;
    ids: string[];
};
export type AssetMediaCreateDto = {
    assetData: Blob;
    fileCreatedAt: string;
    fileModifiedAt: string;
    isFavorite: boolean;
    livePhotoVideoId: string;
    sidecarData?: Blob;
    visibility: AssetVisibility;
};
export type AssetBulkUpdateDto = {
    ids: string[];
    isFavorite: boolean;
    visibility: AssetVisibility;
};
export type AssetBulkUploadCheckDto = {};
export type AssetCopyDto = {
    albums: boolean;
    favorite: boolean;
    sharedLinks: boolean;
    sidecar: boolean;
    sourceId: string;
    stack: boolean;
    targetId: string;
};
export type CheckExistingAssetsDto = {};
export type AssetJobsDto = {
    assetIds: string[];
    name: AssetJobName;
};
export type UpdateAssetDto = {
    isFavorite: boolean;
    livePhotoVideoId: object;
    visibility: AssetVisibility;
};
export type AssetMetadataUpsertDto = {};
export type AssetMediaReplaceDto = {
    assetData: Blob;
    fileCreatedAt: string;
    fileModifiedAt: string;
};
export type SignUpDto = {
    email: string;
    name: string;
    password: string;
};
export type ChangePasswordDto = {
    invalidateSessions: boolean;
    newPassword: string;
    password: string;
};
export type LoginCredentialDto = {
    email: string;
    password: string;
};
export type PinCodeResetDto = {
    pinCode: string;
};
export type PinCodeSetupDto = {
    pinCode: string;
};
export type PinCodeChangeDto = {
    newPinCode: string;
    pinCode: string;
};
export type SessionUnlockDto = {
    pinCode: string;
};
export type AssetIdsDto = {
    assetIds: string[];
};
export type DownloadInfoDto = {
    albumId: string;
    archiveSize: number;
    assetIds: string[];
    userId: string;
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
export type AssetFaceDeleteDto = {};
export type FaceDto = {
    id: string;
};
export type JobCreateDto = {
    name: ManualJobName;
};
export type JobCommandDto = {
    command: JobCommand;
    force: boolean;
};
export type CreateLibraryDto = {
    ownerId: string;
};
export type UpdateLibraryDto = {};
export type ValidateLibraryDto = {};
export type MemoryCreateDto = {
    assetIds: string[];
    isSaved: boolean;
    memoryAt: string;
    seenAt: string;
    "type": MemoryType;
};
export type MemoryUpdateDto = {
    isSaved: boolean;
    memoryAt: string;
    seenAt: string;
};
export type NotificationDeleteAllDto = {
    ids: string[];
};
export type NotificationUpdateAllDto = {
    ids: string[];
    readAt: object;
};
export type NotificationUpdateDto = {
    readAt: object;
};
export type OAuthConfigDto = {};
export type OAuthCallbackDto = {
    url: string;
};
export type PartnerCreateDto = {
    sharedWithId: string;
};
export type PartnerUpdateDto = {};
export type PersonCreateDto = {
    birthDate: object;
    isFavorite: boolean;
    isHidden: boolean;
};
export type PeopleUpdateDto = {};
export type PersonUpdateDto = {
    birthDate: object;
    featureFaceAssetId: string;
    isFavorite: boolean;
    isHidden: boolean;
};
export type MergePersonDto = {
    ids: string[];
};
export type AssetFaceUpdateDto = {};
export type Object = {};
export type MetadataSearchDto = {
    albumIds: string[];
    createdAfter: string;
    createdBefore: string;
    description: string;
    id: string;
    isEncoded: boolean;
    isFavorite: boolean;
    isMotion: boolean;
    isNotInAlbum: boolean;
    isOffline: boolean;
    libraryId: object;
    order: AssetOrder;
    originalFileName: string;
    personIds: string[];
    tagIds: object;
    takenAfter: string;
    takenBefore: string;
    trashedAfter: string;
    trashedBefore: string;
    "type": AssetTypeEnum;
    updatedAfter: string;
    updatedBefore: string;
    visibility: AssetVisibility;
    withDeleted: boolean;
    withExif: boolean;
    withPeople: boolean;
    withStacked: boolean;
};
export type RandomSearchDto = {
    albumIds: string[];
    createdAfter: string;
    createdBefore: string;
    isEncoded: boolean;
    isFavorite: boolean;
    isMotion: boolean;
    isNotInAlbum: boolean;
    isOffline: boolean;
    libraryId: object;
    personIds: string[];
    tagIds: object;
    takenAfter: string;
    takenBefore: string;
    trashedAfter: string;
    trashedBefore: string;
    "type": AssetTypeEnum;
    updatedAfter: string;
    updatedBefore: string;
    visibility: AssetVisibility;
    withDeleted: boolean;
    withExif: boolean;
    withPeople: boolean;
    withStacked: boolean;
};
export type SmartSearchDto = {
    albumIds: string[];
    createdAfter: string;
    createdBefore: string;
    isEncoded: boolean;
    isFavorite: boolean;
    isMotion: boolean;
    isNotInAlbum: boolean;
    isOffline: boolean;
    libraryId: object;
    personIds: string[];
    query: string;
    queryAssetId: string;
    tagIds: object;
    takenAfter: string;
    takenBefore: string;
    trashedAfter: string;
    trashedBefore: string;
    "type": AssetTypeEnum;
    updatedAfter: string;
    updatedBefore: string;
    visibility: AssetVisibility;
    withDeleted: boolean;
    withExif: boolean;
};
export type StatisticsSearchDto = {
    albumIds: string[];
    createdAfter: string;
    createdBefore: string;
    description: string;
    isEncoded: boolean;
    isFavorite: boolean;
    isMotion: boolean;
    isNotInAlbum: boolean;
    isOffline: boolean;
    libraryId: object;
    personIds: string[];
    tagIds: object;
    takenAfter: string;
    takenBefore: string;
    trashedAfter: string;
    trashedBefore: string;
    "type": AssetTypeEnum;
    updatedAfter: string;
    updatedBefore: string;
    visibility: AssetVisibility;
};
export type LicenseKeyDto = {
    activationKey: string;
    licenseKey: string;
};
export type SessionCreateDto = {};
export type SessionUpdateDto = {
    isPendingSyncReset: boolean;
};
export type SharedLinkCreateDto = {
    albumId: string;
    allowDownload: boolean;
    allowUpload: boolean;
    assetIds: string[];
    expiresAt: object;
    showMetadata: boolean;
    "type": SharedLinkType;
};
export type SharedLinkEditDto = {
    allowDownload: boolean;
    allowUpload: boolean;
    changeExpiryTime: boolean;
    showMetadata: boolean;
};
export type StackCreateDto = {
    assetIds: string[];
};
export type StackUpdateDto = {
    primaryAssetId: string;
};
export type SyncAckDeleteDto = {
    types: SyncEntityType[];
};
export type SyncAckSetDto = {};
export type AssetDeltaSyncDto = {
    updatedAfter: string;
    userIds: string[];
};
export type AssetFullSyncDto = {
    lastId: string;
    limit: number;
    updatedUntil: string;
    userId: string;
};
export type SyncStreamDto = {
    reset: boolean;
    types: SyncRequestType[];
};
export type SystemConfigDto = {};
export type AdminOnboardingUpdateDto = {
    isOnboarded: boolean;
};
export type TagCreateDto = {
    parentId: object;
};
export type TagUpsertDto = {};
export type TagBulkAssetsDto = {
    assetIds: string[];
    tagIds: string[];
};
export type TagUpdateDto = {};
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
    stack: (string[] | null)[];
    /** Array of BlurHash strings for generating asset previews (base64 encoded) */
    thumbhash: (string | null)[];
    /** Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED) */
    visibility: AssetVisibility[];
};
export type UserUpdateMeDto = {
    avatarColor: UserAvatarColor;
};
export type OnboardingDto = {
    isOnboarded: boolean;
};
export type CreateProfileImageDto = {
    file: Blob;
};
/**
 * List all activities
 */
export function getActivities({ albumId, assetId, level, $type, userId }: {
    albumId: string;
    assetId: string;
    level: ReactionLevel;
    $type: ReactionType;
    userId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/activities${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/activities", oazapfts.json({
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
    assetId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/activities/statistics${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/admin/maintenance/login", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/admin/notifications", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/notifications/templates/${encodeURIComponent(name)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/admin/notifications/test-email", oazapfts.json({
        ...opts,
        method: "POST",
        body: systemConfigSmtpDto
    })));
}
/**
 * Search users
 */
export function searchUsersAdmin({ id, withDeleted }: {
    id: string;
    withDeleted: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/admin/users${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/admin/users", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}/preferences`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}/preferences`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}/restore`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}/sessions`, {
        ...opts
    }));
}
/**
 * Retrieve user statistics
 */
export function getUserStatisticsAdmin({ id, isFavorite, isTrashed, visibility }: {
    id: string;
    isFavorite: boolean;
    isTrashed: boolean;
    visibility: AssetVisibility;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/admin/users/${encodeURIComponent(id)}/statistics${QS.query(QS.explode({
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
    assetId: string;
    shared: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/albums", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/albums/assets${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/albums/statistics", {
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
    withoutAssets: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/assets`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/users`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: addUsersDto
    })));
}
/**
 * List all API keys
 */
export function getApiKeys(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/api-keys", {
        ...opts
    }));
}
/**
 * Create an API key
 */
export function createApiKey({ apiKeyCreateDto }: {
    apiKeyCreateDto: ApiKeyCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/api-keys", oazapfts.json({
        ...opts,
        method: "POST",
        body: apiKeyCreateDto
    })));
}
/**
 * Retrieve the current API key
 */
export function getMyApiKey(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/api-keys/me", {
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
    return oazapfts.ok(oazapfts.fetchText(`/api-keys/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/api-keys/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/assets${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/assets/bulk-upload-check", oazapfts.json({
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
export function getAllUserAssetsByDeviceId(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/device/${encodeURIComponent(deviceId)}`, {
        ...opts
    }));
}
/**
 * Check existing assets
 */
export function checkExistingAssets({ checkExistingAssetsDto }: {
    checkExistingAssetsDto: CheckExistingAssetsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/exist", oazapfts.json({
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
export function getRandom(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/random", {
        ...opts
    }));
}
/**
 * Get asset statistics
 */
export function getAssetStatistics({ isFavorite, isTrashed, visibility }: {
    isFavorite: boolean;
    isTrashed: boolean;
    visibility: AssetVisibility;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/statistics${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/metadata`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/metadata`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/metadata/${encodeURIComponent(key)}`, {
        ...opts
    }));
}
/**
 * Retrieve asset OCR data
 */
export function getAssetOcr({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/ocr`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
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
    size: AssetMediaSize;
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
    return oazapfts.ok(oazapfts.fetchText("/auth/admin-sign-up", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/auth/change-password", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/auth/login", oazapfts.json({
        ...opts,
        method: "POST",
        body: loginCredentialDto
    })));
}
/**
 * Logout
 */
export function logout(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/logout", {
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
    return oazapfts.ok(oazapfts.fetchText("/auth/status", {
        ...opts
    }));
}
/**
 * Validate access token
 */
export function validateAccessToken(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/validateToken", {
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
    return oazapfts.ok(oazapfts.fetchText(`/download/info${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/duplicates", {
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
    return oazapfts.ok(oazapfts.fetchText(`/faces${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/faces/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: faceDto
    })));
}
/**
 * Retrieve queue counts and status
 */
export function getAllJobsStatus(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/jobs", {
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
export function sendJobCommand({ id, jobCommandDto }: {
    id: JobName;
    jobCommandDto: JobCommandDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/jobs/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: jobCommandDto
    })));
}
/**
 * Retrieve libraries
 */
export function getAllLibraries(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/libraries", {
        ...opts
    }));
}
/**
 * Create a library
 */
export function createLibrary({ createLibraryDto }: {
    createLibraryDto: CreateLibraryDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/libraries", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}/statistics`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}/validate`, oazapfts.json({
        ...opts,
        method: "POST",
        body: validateLibraryDto
    })));
}
/**
 * Retrieve map markers
 */
export function getMapMarkers({ fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums }: {
    fileCreatedAfter: string;
    fileCreatedBefore: string;
    isArchived: boolean;
    isFavorite: boolean;
    withPartners: boolean;
    withSharedAlbums: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/map/markers${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/map/reverse-geocode${QS.query(QS.explode({
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
    $for: string;
    isSaved: boolean;
    isTrashed: boolean;
    order: MemorySearchOrder;
    size: number;
    $type: MemoryType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/memories${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/memories", oazapfts.json({
        ...opts,
        method: "POST",
        body: memoryCreateDto
    })));
}
/**
 * Retrieve memories statistics
 */
export function memoriesStatistics({ $for, isSaved, isTrashed, order, size, $type }: {
    $for: string;
    isSaved: boolean;
    isTrashed: boolean;
    order: MemorySearchOrder;
    size: number;
    $type: MemoryType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/memories/statistics${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
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
    id: string;
    level: NotificationLevel;
    $type: NotificationType;
    unread: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/notifications${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/notifications/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/notifications/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/oauth/authorize", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/oauth/callback", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/oauth/link", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/oauth/unlink", {
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
    return oazapfts.ok(oazapfts.fetchText(`/partners${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/partners", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/partners/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/partners/${encodeURIComponent(id)}`, oazapfts.json({
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
    closestAssetId: string;
    closestPersonId: string;
    page?: number;
    size?: number;
    withHidden: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/people${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/people", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/people", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}/merge`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}/reassign`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}/statistics`, {
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
 * Retrieve assets by city
 */
export function getAssetsByCity(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/search/cities", {
        ...opts
    }));
}
/**
 * Retrieve explore data
 */
export function getExploreData(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/search/explore", {
        ...opts
    }));
}
/**
 * Search large assets
 */
export function searchLargeAssets({ albumIds, createdAfter, createdBefore, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, libraryId, minFileSize, personIds, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, $type, updatedAfter, updatedBefore, visibility, withDeleted, withExif }: {
    albumIds: string[];
    createdAfter: string;
    createdBefore: string;
    isEncoded: boolean;
    isFavorite: boolean;
    isMotion: boolean;
    isNotInAlbum: boolean;
    isOffline: boolean;
    libraryId: Object;
    minFileSize: number;
    personIds: string[];
    tagIds: Object;
    takenAfter: string;
    takenBefore: string;
    trashedAfter: string;
    trashedBefore: string;
    $type: AssetTypeEnum;
    updatedAfter: string;
    updatedBefore: string;
    visibility: AssetVisibility;
    withDeleted: boolean;
    withExif: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/search/large-assets${QS.query(QS.explode({
        albumIds,
        createdAfter,
        createdBefore,
        isEncoded,
        isFavorite,
        isMotion,
        isNotInAlbum,
        isOffline,
        libraryId,
        minFileSize,
        personIds,
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
    return oazapfts.ok(oazapfts.fetchText("/search/metadata", oazapfts.json({
        ...opts,
        method: "POST",
        body: metadataSearchDto
    })));
}
/**
 * Search people
 */
export function searchPerson({ withHidden }: {
    withHidden: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/search/person${QS.query(QS.explode({
        withHidden
    }))}`, {
        ...opts
    }));
}
/**
 * Search places
 */
export function searchPlaces(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/search/places", {
        ...opts
    }));
}
/**
 * Search random assets
 */
export function searchRandom({ randomSearchDto }: {
    randomSearchDto: RandomSearchDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/search/random", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/search/smart", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/search/statistics", oazapfts.json({
        ...opts,
        method: "POST",
        body: statisticsSearchDto
    })));
}
/**
 * Retrieve search suggestions
 */
export function getSearchSuggestions({ includeNull, $type }: {
    includeNull: boolean;
    $type: SearchSuggestionType;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/search/suggestions${QS.query(QS.explode({
        includeNull,
        "type": $type
    }))}`, {
        ...opts
    }));
}
/**
 * Get server information
 */
export function getAboutInfo(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/about", {
        ...opts
    }));
}
/**
 * Get APK links
 */
export function getApkLinks(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/apk-links", {
        ...opts
    }));
}
/**
 * Get config
 */
export function getServerConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/config", {
        ...opts
    }));
}
/**
 * Get features
 */
export function getServerFeatures(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/features", {
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
    return oazapfts.ok(oazapfts.fetchText("/server/license", {
        ...opts
    }));
}
/**
 * Set server product key
 */
export function setServerLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/license", oazapfts.json({
        ...opts,
        method: "PUT",
        body: licenseKeyDto
    })));
}
/**
 * Get supported media types
 */
export function getSupportedMediaTypes(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/media-types", {
        ...opts
    }));
}
/**
 * Ping
 */
export function pingServer(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/ping", {
        ...opts
    }));
}
/**
 * Get statistics
 */
export function getServerStatistics(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/statistics", {
        ...opts
    }));
}
/**
 * Get storage
 */
export function getStorage(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/storage", {
        ...opts
    }));
}
/**
 * Get theme
 */
export function getTheme(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/theme", {
        ...opts
    }));
}
/**
 * Get server version
 */
export function getServerVersion(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/version", {
        ...opts
    }));
}
/**
 * Get version check status
 */
export function getVersionCheck(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/version-check", {
        ...opts
    }));
}
/**
 * Get version history
 */
export function getVersionHistory(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/server/version-history", {
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
    return oazapfts.ok(oazapfts.fetchText("/sessions", {
        ...opts
    }));
}
/**
 * Create a session
 */
export function createSession({ sessionCreateDto }: {
    sessionCreateDto: SessionCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/sessions", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/sessions/${encodeURIComponent(id)}`, oazapfts.json({
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
    albumId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/shared-links${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/shared-links", oazapfts.json({
        ...opts,
        method: "POST",
        body: sharedLinkCreateDto
    })));
}
/**
 * Retrieve current shared link
 */
export function getMySharedLink({ key, password, slug }: {
    key?: string;
    password: string;
    slug?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/me${QS.query(QS.explode({
        key,
        password,
        slug
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
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}/assets${QS.query(QS.explode({
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
    primaryAssetId: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/stacks${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/stacks", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/sync/ack", {
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
    return oazapfts.ok(oazapfts.fetchText("/sync/delta-sync", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/sync/full-sync", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/system-config", {
        ...opts
    }));
}
/**
 * Update system configuration
 */
export function updateConfig({ systemConfigDto }: {
    systemConfigDto: SystemConfigDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-config", oazapfts.json({
        ...opts,
        method: "PUT",
        body: systemConfigDto
    })));
}
/**
 * Get system configuration defaults
 */
export function getConfigDefaults(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-config/defaults", {
        ...opts
    }));
}
/**
 * Get storage template options
 */
export function getStorageTemplateOptions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-config/storage-template-options", {
        ...opts
    }));
}
/**
 * Retrieve admin onboarding
 */
export function getAdminOnboarding(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-metadata/admin-onboarding", {
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
    return oazapfts.ok(oazapfts.fetchText("/system-metadata/reverse-geocoding-state", {
        ...opts
    }));
}
/**
 * Retrieve version check state
 */
export function getVersionCheckState(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/system-metadata/version-check-state", {
        ...opts
    }));
}
/**
 * Retrieve tags
 */
export function getAllTags(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/tags", {
        ...opts
    }));
}
/**
 * Create a tag
 */
export function createTag({ tagCreateDto }: {
    tagCreateDto: TagCreateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/tags", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/tags", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/tags/assets", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Get time bucket
 */
export function getTimeBucket({ albumId, isFavorite, isTrashed, key, order, personId, slug, tagId, timeBucket, userId, visibility, withCoordinates, withPartners, withStacked }: {
    albumId: string;
    isFavorite: boolean;
    isTrashed: boolean;
    key?: string;
    order: AssetOrder;
    personId: string;
    slug?: string;
    tagId: string;
    timeBucket: string;
    userId: string;
    visibility: AssetVisibility;
    withCoordinates: boolean;
    withPartners: boolean;
    withStacked: boolean;
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
    albumId: string;
    isFavorite: boolean;
    isTrashed: boolean;
    key?: string;
    order: AssetOrder;
    personId: string;
    slug?: string;
    tagId: string;
    userId: string;
    visibility: AssetVisibility;
    withCoordinates: boolean;
    withPartners: boolean;
    withStacked: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/timeline/buckets${QS.query(QS.explode({
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
    return oazapfts.ok(oazapfts.fetchText("/trash/empty", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Restore trash
 */
export function restoreTrash(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/trash/restore", {
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
    return oazapfts.ok(oazapfts.fetchText("/trash/restore/assets", oazapfts.json({
        ...opts,
        method: "POST",
        body: bulkIdsDto
    })));
}
/**
 * Get all users
 */
export function searchUsers(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users", {
        ...opts
    }));
}
/**
 * Get current user
 */
export function getMyUser(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me", {
        ...opts
    }));
}
/**
 * Update current user
 */
export function updateMyUser({ userUpdateMeDto }: {
    userUpdateMeDto: UserUpdateMeDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/users/me/license", {
        ...opts
    }));
}
/**
 * Set user product key
 */
export function setUserLicense({ licenseKeyDto }: {
    licenseKeyDto: LicenseKeyDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/license", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/users/me/onboarding", {
        ...opts
    }));
}
/**
 * Update user onboarding
 */
export function setUserOnboarding({ onboardingDto }: {
    onboardingDto: OnboardingDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/onboarding", oazapfts.json({
        ...opts,
        method: "PUT",
        body: onboardingDto
    })));
}
/**
 * Get my preferences
 */
export function getMyPreferences(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/preferences", {
        ...opts
    }));
}
/**
 * Update my preferences
 */
export function updateMyPreferences({ userPreferencesUpdateDto }: {
    userPreferencesUpdateDto: UserPreferencesUpdateDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/preferences", oazapfts.json({
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
    return oazapfts.ok(oazapfts.fetchText("/users/profile-image", oazapfts.multipart({
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
    return oazapfts.ok(oazapfts.fetchText(`/users/${encodeURIComponent(id)}`, {
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
    return oazapfts.ok(oazapfts.fetchText(`/view/folder${QS.query(QS.explode({
        path
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve unique paths
 */
export function getUniqueOriginalPaths(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/view/folder/unique-paths", {
        ...opts
    }));
}
export enum ReactionLevel {
    Album = "album",
    Asset = "asset"
}
export enum ReactionType {
    Comment = "comment",
    Like = "like"
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
export enum AssetVisibility {
    Archive = "archive",
    Timeline = "timeline",
    Hidden = "hidden",
    Locked = "locked"
}
export enum AssetOrder {
    Asc = "asc",
    Desc = "desc"
}
export enum AlbumUserRole {
    Editor = "editor",
    Viewer = "viewer"
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
    AdminUserCreate = "adminUser.create",
    AdminUserRead = "adminUser.read",
    AdminUserUpdate = "adminUser.update",
    AdminUserDelete = "adminUser.delete",
    AdminSessionRead = "adminSession.read",
    AdminAuthUnlinkAll = "adminAuth.unlinkAll"
}
export enum AssetJobName {
    RefreshFaces = "refresh-faces",
    RefreshMetadata = "refresh-metadata",
    RegenerateThumbnail = "regenerate-thumbnail",
    TranscodeVideo = "transcode-video"
}
export enum AssetMetadataKey {
    MobileApp = "mobile-app"
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
export enum JobName {
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
    Ocr = "ocr"
}
export enum JobCommand {
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
export enum AssetTypeEnum {
    Image = "IMAGE",
    Video = "VIDEO",
    Audio = "AUDIO",
    Other = "OTHER"
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
