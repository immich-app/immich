/**
 * Immich
 * 2.7.5
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults = {
    headers: {},
    baseUrl: "/api"
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "/api"
};
/**
 * List all activities
 */
export function getActivities({ albumId, assetId, level, $type, userId }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/activities${QS.query(QS.explode({
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
export function createActivity({ activityCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/activities", oazapfts.json({
        ...opts,
        method: "POST",
        body: activityCreateDto
    })));
}
/**
 * Retrieve activity statistics
 */
export function getActivityStatistics({ albumId, assetId }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/activities/statistics${QS.query(QS.explode({
        albumId,
        assetId
    }))}`, {
        ...opts
    }));
}
/**
 * Delete an activity
 */
export function deleteActivity({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/activities/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Unlink all OAuth accounts
 */
export function unlinkAllOAuthAccountsAdmin(opts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/auth/unlink-all", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Delete database backup
 */
export function deleteDatabaseBackup({ databaseBackupDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: databaseBackupDeleteDto
    })));
}
/**
 * List database backups
 */
export function listDatabaseBackups(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/database-backups", {
        ...opts
    }));
}
/**
 * Start database backup restore flow
 */
export function startDatabaseRestoreFlow(opts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups/start-restore", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Upload database backup
 */
export function uploadDatabaseBackup({ databaseBackupUploadDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/database-backups/upload", oazapfts.multipart({
        ...opts,
        method: "POST",
        body: databaseBackupUploadDto
    })));
}
/**
 * Download database backup
 */
export function downloadDatabaseBackup({ filename }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/admin/database-backups/${encodeURIComponent(filename)}`, {
        ...opts
    }));
}
/**
 * Set maintenance mode
 */
export function setMaintenanceMode({ setMaintenanceModeDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/admin/maintenance", oazapfts.json({
        ...opts,
        method: "POST",
        body: setMaintenanceModeDto
    })));
}
/**
 * Detect existing install
 */
export function detectPriorInstall(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/maintenance/detect-install", {
        ...opts
    }));
}
/**
 * Log into maintenance mode
 */
export function maintenanceLogin({ maintenanceLoginDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/maintenance/login", oazapfts.json({
        ...opts,
        method: "POST",
        body: maintenanceLoginDto
    })));
}
/**
 * Get maintenance mode status
 */
export function getMaintenanceStatus(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/maintenance/status", {
        ...opts
    }));
}
/**
 * Create a notification
 */
export function createNotification({ notificationCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/notifications", oazapfts.json({
        ...opts,
        method: "POST",
        body: notificationCreateDto
    })));
}
/**
 * Render email template
 */
export function getNotificationTemplateAdmin({ name, templateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/notifications/templates/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: templateDto
    })));
}
/**
 * Send test email
 */
export function sendTestEmailAdmin({ systemConfigSmtpDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/notifications/test-email", oazapfts.json({
        ...opts,
        method: "POST",
        body: systemConfigSmtpDto
    })));
}
/**
 * Search users
 */
export function searchUsersAdmin({ id, withDeleted }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users${QS.query(QS.explode({
        id,
        withDeleted
    }))}`, {
        ...opts
    }));
}
/**
 * Create a user
 */
export function createUserAdmin({ userAdminCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/admin/users", oazapfts.json({
        ...opts,
        method: "POST",
        body: userAdminCreateDto
    })));
}
/**
 * Delete a user
 */
export function deleteUserAdmin({ id, userAdminDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: userAdminDeleteDto
    })));
}
/**
 * Retrieve a user
 */
export function getUserAdmin({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a user
 */
export function updateUserAdmin({ id, userAdminUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: userAdminUpdateDto
    })));
}
/**
 * Retrieve user preferences
 */
export function getUserPreferencesAdmin({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}/preferences`, {
        ...opts
    }));
}
/**
 * Update user preferences
 */
export function updateUserPreferencesAdmin({ id, userPreferencesUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}/preferences`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: userPreferencesUpdateDto
    })));
}
/**
 * Restore a deleted user
 */
export function restoreUserAdmin({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}/restore`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve user sessions
 */
export function getUserSessionsAdmin({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}/sessions`, {
        ...opts
    }));
}
/**
 * Retrieve user statistics
 */
export function getUserStatisticsAdmin({ id, isFavorite, isTrashed, visibility }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/admin/users/${encodeURIComponent(id)}/statistics${QS.query(QS.explode({
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
export function getAllAlbums({ assetId, shared }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums${QS.query(QS.explode({
        assetId,
        shared
    }))}`, {
        ...opts
    }));
}
/**
 * Create an album
 */
export function createAlbum({ createAlbumDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/albums", oazapfts.json({
        ...opts,
        method: "POST",
        body: createAlbumDto
    })));
}
/**
 * Add assets to albums
 */
export function addAssetsToAlbums({ albumsAddAssetsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/albums/assets", oazapfts.json({
        ...opts,
        method: "PUT",
        body: albumsAddAssetsDto
    })));
}
/**
 * Retrieve album statistics
 */
export function getAlbumStatistics(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/albums/statistics", {
        ...opts
    }));
}
/**
 * Delete an album
 */
export function deleteAlbum({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve an album
 */
export function getAlbumInfo({ id, key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Update an album
 */
export function updateAlbumInfo({ id, updateAlbumDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: updateAlbumDto
    })));
}
/**
 * Remove assets from an album
 */
export function removeAssetFromAlbum({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Add assets to an album
 */
export function addAssetsToAlbum({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Retrieve album map markers
 */
export function getAlbumMapMarkers({ id, key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}/map-markers${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Remove user from album
 */
export function removeUserFromAlbum({ id, userId }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Update user role
 */
export function updateAlbumUser({ id, userId, updateAlbumUserDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/albums/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateAlbumUserDto
    })));
}
/**
 * Share album with users
 */
export function addUsersToAlbum({ id, addUsersDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/albums/${encodeURIComponent(id)}/users`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: addUsersDto
    })));
}
/**
 * List all API keys
 */
export function getApiKeys(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/api-keys", {
        ...opts
    }));
}
/**
 * Create an API key
 */
export function createApiKey({ apiKeyCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/api-keys", oazapfts.json({
        ...opts,
        method: "POST",
        body: apiKeyCreateDto
    })));
}
/**
 * Retrieve the current API key
 */
export function getMyApiKey(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/api-keys/me", {
        ...opts
    }));
}
/**
 * Delete an API key
 */
export function deleteApiKey({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/api-keys/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve an API key
 */
export function getApiKey({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/api-keys/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update an API key
 */
export function updateApiKey({ id, apiKeyUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/api-keys/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: apiKeyUpdateDto
    })));
}
/**
 * Delete assets
 */
export function deleteAssets({ assetBulkDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/assets", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetBulkDeleteDto
    })));
}
/**
 * Upload asset
 */
export function uploadAsset({ key, slug, xImmichChecksum, assetMediaCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets${QS.query(QS.explode({
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
export function updateAssets({ assetBulkUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/assets", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetBulkUpdateDto
    })));
}
/**
 * Check bulk upload
 */
export function checkBulkUpload({ assetBulkUploadCheckDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/assets/bulk-upload-check", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetBulkUploadCheckDto
    })));
}
/**
 * Copy asset
 */
export function copyAsset({ assetCopyDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/copy", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetCopyDto
    })));
}
/**
 * Run an asset job
 */
export function runAssetJobs({ assetJobsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/jobs", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetJobsDto
    })));
}
/**
 * Delete asset metadata
 */
export function deleteBulkAssetMetadata({ assetMetadataBulkDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/assets/metadata", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetMetadataBulkDeleteDto
    })));
}
/**
 * Upsert asset metadata
 */
export function updateBulkAssetMetadata({ assetMetadataBulkUpsertDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/assets/metadata", oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetMetadataBulkUpsertDto
    })));
}
/**
 * Get asset statistics
 */
export function getAssetStatistics({ isFavorite, isTrashed, visibility }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/statistics${QS.query(QS.explode({
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
export function getAssetInfo({ id, key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Update an asset
 */
export function updateAsset({ id, updateAssetDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateAssetDto
    })));
}
/**
 * Remove edits from an existing asset
 */
export function removeAssetEdits({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/edits`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve edits for an existing asset
 */
export function getAssetEdits({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/edits`, {
        ...opts
    }));
}
/**
 * Apply edits to an existing asset
 */
export function editAsset({ id, assetEditsCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/edits`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetEditsCreateDto
    })));
}
/**
 * Get asset metadata
 */
export function getAssetMetadata({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/metadata`, {
        ...opts
    }));
}
/**
 * Update asset metadata
 */
export function updateAssetMetadata({ id, assetMetadataUpsertDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/metadata`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetMetadataUpsertDto
    })));
}
/**
 * Delete asset metadata by key
 */
export function deleteAssetMetadata({ id, key }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/assets/${encodeURIComponent(id)}/metadata/${encodeURIComponent(key)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve asset metadata by key
 */
export function getAssetMetadataByKey({ id, key }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/metadata/${encodeURIComponent(key)}`, {
        ...opts
    }));
}
/**
 * Retrieve asset OCR data
 */
export function getAssetOcr({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/assets/${encodeURIComponent(id)}/ocr`, {
        ...opts
    }));
}
/**
 * Download original asset
 */
export function downloadAsset({ edited, id, key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
        edited,
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * View asset thumbnail
 */
export function viewAsset({ edited, id, key, size, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/assets/${encodeURIComponent(id)}/thumbnail${QS.query(QS.explode({
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
export function playAssetVideo({ id, key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/assets/${encodeURIComponent(id)}/video/playback${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Register admin
 */
export function signUpAdmin({ signUpDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/admin-sign-up", oazapfts.json({
        ...opts,
        method: "POST",
        body: signUpDto
    })));
}
/**
 * Change password
 */
export function changePassword({ changePasswordDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/change-password", oazapfts.json({
        ...opts,
        method: "POST",
        body: changePasswordDto
    })));
}
/**
 * Login
 */
export function login({ loginCredentialDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/login", oazapfts.json({
        ...opts,
        method: "POST",
        body: loginCredentialDto
    })));
}
/**
 * Logout
 */
export function logout(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/logout", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Reset pin code
 */
export function resetPinCode({ pinCodeResetDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: pinCodeResetDto
    })));
}
/**
 * Setup pin code
 */
export function setupPinCode({ pinCodeSetupDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "POST",
        body: pinCodeSetupDto
    })));
}
/**
 * Change pin code
 */
export function changePinCode({ pinCodeChangeDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/pin-code", oazapfts.json({
        ...opts,
        method: "PUT",
        body: pinCodeChangeDto
    })));
}
/**
 * Lock auth session
 */
export function lockAuthSession(opts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/session/lock", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Unlock auth session
 */
export function unlockAuthSession({ sessionUnlockDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/auth/session/unlock", oazapfts.json({
        ...opts,
        method: "POST",
        body: sessionUnlockDto
    })));
}
/**
 * Retrieve auth status
 */
export function getAuthStatus(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/status", {
        ...opts
    }));
}
/**
 * Validate access token
 */
export function validateAccessToken(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/auth/validateToken", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Download asset archive
 */
export function downloadArchive({ key, slug, downloadArchiveDto }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/download/archive${QS.query(QS.explode({
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
export function getDownloadInfo({ key, slug, downloadInfoDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/download/info${QS.query(QS.explode({
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
export function deleteDuplicates({ bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/duplicates", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Retrieve duplicates
 */
export function getAssetDuplicates(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/duplicates", {
        ...opts
    }));
}
/**
 * Resolve duplicate groups
 */
export function resolveDuplicates({ duplicateResolveDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/duplicates/resolve", oazapfts.json({
        ...opts,
        method: "POST",
        body: duplicateResolveDto
    })));
}
/**
 * Delete a duplicate
 */
export function deleteDuplicate({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/duplicates/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve faces for asset
 */
export function getFaces({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/faces${QS.query(QS.explode({
        id
    }))}`, {
        ...opts
    }));
}
/**
 * Create a face
 */
export function createFace({ assetFaceCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/faces", oazapfts.json({
        ...opts,
        method: "POST",
        body: assetFaceCreateDto
    })));
}
/**
 * Delete a face
 */
export function deleteFace({ id, assetFaceDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/faces/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetFaceDeleteDto
    })));
}
/**
 * Re-assign a face to another person
 */
export function reassignFacesById({ id, faceDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/faces/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: faceDto
    })));
}
/**
 * Retrieve queue counts and status
 */
export function getQueuesLegacy(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/jobs", {
        ...opts
    }));
}
/**
 * Create a manual job
 */
export function createJob({ jobCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/jobs", oazapfts.json({
        ...opts,
        method: "POST",
        body: jobCreateDto
    })));
}
/**
 * Run jobs
 */
export function runQueueCommandLegacy({ name, queueCommandDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/jobs/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: queueCommandDto
    })));
}
/**
 * Retrieve libraries
 */
export function getAllLibraries(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/libraries", {
        ...opts
    }));
}
/**
 * Create a library
 */
export function createLibrary({ createLibraryDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/libraries", oazapfts.json({
        ...opts,
        method: "POST",
        body: createLibraryDto
    })));
}
/**
 * Delete a library
 */
export function deleteLibrary({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a library
 */
export function getLibrary({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/libraries/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a library
 */
export function updateLibrary({ id, updateLibraryDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/libraries/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: updateLibraryDto
    })));
}
/**
 * Scan a library
 */
export function scanLibrary({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/libraries/${encodeURIComponent(id)}/scan`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve library statistics
 */
export function getLibraryStatistics({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/libraries/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
/**
 * Validate library settings
 */
export function validate({ id, validateLibraryDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/libraries/${encodeURIComponent(id)}/validate`, oazapfts.json({
        ...opts,
        method: "POST",
        body: validateLibraryDto
    })));
}
/**
 * Retrieve map markers
 */
export function getMapMarkers({ fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/map/markers${QS.query(QS.explode({
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
export function reverseGeocode({ lat, lon }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/map/reverse-geocode${QS.query(QS.explode({
        lat,
        lon
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve memories
 */
export function searchMemories({ $for, isSaved, isTrashed, order, size, $type }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories${QS.query(QS.explode({
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
export function createMemory({ memoryCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/memories", oazapfts.json({
        ...opts,
        method: "POST",
        body: memoryCreateDto
    })));
}
/**
 * Retrieve memories statistics
 */
export function memoriesStatistics({ $for, isSaved, isTrashed, order, size, $type }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories/statistics${QS.query(QS.explode({
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
export function deleteMemory({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/memories/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a memory
 */
export function getMemory({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a memory
 */
export function updateMemory({ id, memoryUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: memoryUpdateDto
    })));
}
/**
 * Remove assets from a memory
 */
export function removeMemoryAssets({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Add assets to a memory
 */
export function addMemoryAssets({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/memories/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Delete notifications
 */
export function deleteNotifications({ notificationDeleteAllDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/notifications", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: notificationDeleteAllDto
    })));
}
/**
 * Retrieve notifications
 */
export function getNotifications({ id, level, $type, unread }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/notifications${QS.query(QS.explode({
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
export function updateNotifications({ notificationUpdateAllDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/notifications", oazapfts.json({
        ...opts,
        method: "PUT",
        body: notificationUpdateAllDto
    })));
}
/**
 * Delete a notification
 */
export function deleteNotification({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/notifications/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get a notification
 */
export function getNotification({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/notifications/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a notification
 */
export function updateNotification({ id, notificationUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/notifications/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: notificationUpdateDto
    })));
}
/**
 * Start OAuth
 */
export function startOAuth({ oAuthConfigDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/oauth/authorize", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthConfigDto
    })));
}
/**
 * Backchannel OAuth logout
 */
export function logoutOAuth({ oAuthBackchannelLogoutDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/oauth/backchannel-logout", oazapfts.form({
        ...opts,
        method: "POST",
        body: oAuthBackchannelLogoutDto
    })));
}
/**
 * Finish OAuth
 */
export function finishOAuth({ oAuthCallbackDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/oauth/callback", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthCallbackDto
    })));
}
/**
 * Link OAuth account
 */
export function linkOAuthAccount({ oAuthCallbackDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/oauth/link", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthCallbackDto
    })));
}
/**
 * Redirect OAuth to mobile
 */
export function redirectOAuthToMobile(opts) {
    return oazapfts.ok(oazapfts.fetchText("/oauth/mobile-redirect", {
        ...opts
    }));
}
/**
 * Unlink OAuth account
 */
export function unlinkOAuthAccount(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/oauth/unlink", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve partners
 */
export function getPartners({ direction }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/partners${QS.query(QS.explode({
        direction
    }))}`, {
        ...opts
    }));
}
/**
 * Create a partner
 */
export function createPartner({ partnerCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/partners", oazapfts.json({
        ...opts,
        method: "POST",
        body: partnerCreateDto
    })));
}
/**
 * Remove a partner
 */
export function removePartner({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/partners/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Create a partner
 */
export function createPartnerDeprecated({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/partners/${encodeURIComponent(id)}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Update a partner
 */
export function updatePartner({ id, partnerUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/partners/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: partnerUpdateDto
    })));
}
/**
 * Delete people
 */
export function deletePeople({ bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/people", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Get all people
 */
export function getAllPeople({ closestAssetId, closestPersonId, page, size, withHidden }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people${QS.query(QS.explode({
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
export function createPerson({ personCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/people", oazapfts.json({
        ...opts,
        method: "POST",
        body: personCreateDto
    })));
}
/**
 * Update people
 */
export function updatePeople({ peopleUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/people", oazapfts.json({
        ...opts,
        method: "PUT",
        body: peopleUpdateDto
    })));
}
/**
 * Delete person
 */
export function deletePerson({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/people/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get a person
 */
export function getPerson({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update person
 */
export function updatePerson({ id, personUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: personUpdateDto
    })));
}
/**
 * Merge people
 */
export function mergePerson({ id, mergePersonDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people/${encodeURIComponent(id)}/merge`, oazapfts.json({
        ...opts,
        method: "POST",
        body: mergePersonDto
    })));
}
/**
 * Reassign faces
 */
export function reassignFaces({ id, assetFaceUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people/${encodeURIComponent(id)}/reassign`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetFaceUpdateDto
    })));
}
/**
 * Get person statistics
 */
export function getPersonStatistics({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/people/${encodeURIComponent(id)}/statistics`, {
        ...opts
    }));
}
/**
 * Get person thumbnail
 */
export function getPersonThumbnail({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/people/${encodeURIComponent(id)}/thumbnail`, {
        ...opts
    }));
}
/**
 * List all plugins
 */
export function getPlugins(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/plugins", {
        ...opts
    }));
}
/**
 * List all plugin triggers
 */
export function getPluginTriggers(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/plugins/triggers", {
        ...opts
    }));
}
/**
 * Retrieve a plugin
 */
export function getPlugin({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/plugins/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * List all queues
 */
export function getQueues(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/queues", {
        ...opts
    }));
}
/**
 * Retrieve a queue
 */
export function getQueue({ name }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/queues/${encodeURIComponent(name)}`, {
        ...opts
    }));
}
/**
 * Update a queue
 */
export function updateQueue({ name, queueUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/queues/${encodeURIComponent(name)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: queueUpdateDto
    })));
}
/**
 * Empty a queue
 */
export function emptyQueue({ name, queueDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/queues/${encodeURIComponent(name)}/jobs`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: queueDeleteDto
    })));
}
/**
 * Retrieve queue jobs
 */
export function getQueueJobs({ name, status }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/queues/${encodeURIComponent(name)}/jobs${QS.query(QS.explode({
        status
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve assets by city
 */
export function getAssetsByCity(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/cities", {
        ...opts
    }));
}
/**
 * Retrieve explore data
 */
export function getExploreData(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/explore", {
        ...opts
    }));
}
/**
 * Search large assets
 */
export function searchLargeAssets({ albumIds, city, country, createdAfter, createdBefore, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, lensModel, libraryId, make, minFileSize, model, ocr, personIds, rating, size, state, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, $type, updatedAfter, updatedBefore, visibility, withDeleted, withExif }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/search/large-assets${QS.query(QS.explode({
        albumIds,
        city,
        country,
        createdAfter,
        createdBefore,
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
export function searchAssets({ metadataSearchDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/metadata", oazapfts.json({
        ...opts,
        method: "POST",
        body: metadataSearchDto
    })));
}
/**
 * Search people
 */
export function searchPerson({ name, withHidden }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/search/person${QS.query(QS.explode({
        name,
        withHidden
    }))}`, {
        ...opts
    }));
}
/**
 * Search places
 */
export function searchPlaces({ name }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/search/places${QS.query(QS.explode({
        name
    }))}`, {
        ...opts
    }));
}
/**
 * Search random assets
 */
export function searchRandom({ randomSearchDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/random", oazapfts.json({
        ...opts,
        method: "POST",
        body: randomSearchDto
    })));
}
/**
 * Smart asset search
 */
export function searchSmart({ smartSearchDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/smart", oazapfts.json({
        ...opts,
        method: "POST",
        body: smartSearchDto
    })));
}
/**
 * Search asset statistics
 */
export function searchAssetStatistics({ statisticsSearchDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/search/statistics", oazapfts.json({
        ...opts,
        method: "POST",
        body: statisticsSearchDto
    })));
}
/**
 * Retrieve search suggestions
 */
export function getSearchSuggestions({ country, includeNull, lensModel, make, model, state, $type }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/search/suggestions${QS.query(QS.explode({
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
export function getAboutInfo(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/about", {
        ...opts
    }));
}
/**
 * Get APK links
 */
export function getApkLinks(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/apk-links", {
        ...opts
    }));
}
/**
 * Get config
 */
export function getServerConfig(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/config", {
        ...opts
    }));
}
/**
 * Get features
 */
export function getServerFeatures(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/features", {
        ...opts
    }));
}
/**
 * Delete server product key
 */
export function deleteServerLicense(opts) {
    return oazapfts.ok(oazapfts.fetchText("/server/license", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get product key
 */
export function getServerLicense(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/license", {
        ...opts
    }));
}
/**
 * Set server product key
 */
export function setServerLicense({ licenseKeyDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/license", oazapfts.json({
        ...opts,
        method: "PUT",
        body: licenseKeyDto
    })));
}
/**
 * Get supported media types
 */
export function getSupportedMediaTypes(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/media-types", {
        ...opts
    }));
}
/**
 * Ping
 */
export function pingServer(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/ping", {
        ...opts
    }));
}
/**
 * Get statistics
 */
export function getServerStatistics(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/statistics", {
        ...opts
    }));
}
/**
 * Get storage
 */
export function getStorage(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/storage", {
        ...opts
    }));
}
/**
 * Get server version
 */
export function getServerVersion(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/version", {
        ...opts
    }));
}
/**
 * Get version check status
 */
export function getVersionCheck(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/version-check", {
        ...opts
    }));
}
/**
 * Get version history
 */
export function getVersionHistory(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/server/version-history", {
        ...opts
    }));
}
/**
 * Delete all sessions
 */
export function deleteAllSessions(opts) {
    return oazapfts.ok(oazapfts.fetchText("/sessions", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve sessions
 */
export function getSessions(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/sessions", {
        ...opts
    }));
}
/**
 * Create a session
 */
export function createSession({ sessionCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/sessions", oazapfts.json({
        ...opts,
        method: "POST",
        body: sessionCreateDto
    })));
}
/**
 * Delete a session
 */
export function deleteSession({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/sessions/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Update a session
 */
export function updateSession({ id, sessionUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/sessions/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: sessionUpdateDto
    })));
}
/**
 * Lock a session
 */
export function lockSession({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/sessions/${encodeURIComponent(id)}/lock`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Retrieve all shared links
 */
export function getAllSharedLinks({ albumId, id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links${QS.query(QS.explode({
        albumId,
        id
    }))}`, {
        ...opts
    }));
}
/**
 * Create a shared link
 */
export function createSharedLink({ sharedLinkCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/shared-links", oazapfts.json({
        ...opts,
        method: "POST",
        body: sharedLinkCreateDto
    })));
}
/**
 * Shared link login
 */
export function sharedLinkLogin({ key, slug, sharedLinkLoginDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/login${QS.query(QS.explode({
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
export function getMySharedLink({ key, slug }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/me${QS.query(QS.explode({
        key,
        slug
    }))}`, {
        ...opts
    }));
}
/**
 * Delete a shared link
 */
export function removeSharedLink({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/shared-links/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a shared link
 */
export function getSharedLinkById({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a shared link
 */
export function updateSharedLink({ id, sharedLinkEditDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: sharedLinkEditDto
    })));
}
/**
 * Remove assets from a shared link
 */
export function removeSharedLinkAssets({ id, assetIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: assetIdsDto
    })));
}
/**
 * Add assets to a shared link
 */
export function addSharedLinkAssets({ id, assetIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/shared-links/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: assetIdsDto
    })));
}
/**
 * Delete stacks
 */
export function deleteStacks({ bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/stacks", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Retrieve stacks
 */
export function searchStacks({ primaryAssetId }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/stacks${QS.query(QS.explode({
        primaryAssetId
    }))}`, {
        ...opts
    }));
}
/**
 * Create a stack
 */
export function createStack({ stackCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/stacks", oazapfts.json({
        ...opts,
        method: "POST",
        body: stackCreateDto
    })));
}
/**
 * Delete a stack
 */
export function deleteStack({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a stack
 */
export function getStack({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/stacks/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a stack
 */
export function updateStack({ id, stackUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/stacks/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: stackUpdateDto
    })));
}
/**
 * Remove an asset from a stack
 */
export function removeAssetFromStack({ assetId, id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/stacks/${encodeURIComponent(id)}/assets/${encodeURIComponent(assetId)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Delete acknowledgements
 */
export function deleteSyncAck({ syncAckDeleteDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/ack", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: syncAckDeleteDto
    })));
}
/**
 * Retrieve acknowledgements
 */
export function getSyncAck(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/sync/ack", {
        ...opts
    }));
}
/**
 * Acknowledge changes
 */
export function sendSyncAck({ syncAckSetDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/ack", oazapfts.json({
        ...opts,
        method: "POST",
        body: syncAckSetDto
    })));
}
/**
 * Stream sync changes
 */
export function getSyncStream({ syncStreamDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/sync/stream", oazapfts.json({
        ...opts,
        method: "POST",
        body: syncStreamDto
    })));
}
/**
 * Get system configuration
 */
export function getConfig(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-config", {
        ...opts
    }));
}
/**
 * Update system configuration
 */
export function updateConfig({ systemConfigDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-config", oazapfts.json({
        ...opts,
        method: "PUT",
        body: systemConfigDto
    })));
}
/**
 * Get system configuration defaults
 */
export function getConfigDefaults(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-config/defaults", {
        ...opts
    }));
}
/**
 * Get storage template options
 */
export function getStorageTemplateOptions(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-config/storage-template-options", {
        ...opts
    }));
}
/**
 * Retrieve admin onboarding
 */
export function getAdminOnboarding(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-metadata/admin-onboarding", {
        ...opts
    }));
}
/**
 * Update admin onboarding
 */
export function updateAdminOnboarding({ adminOnboardingUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchText("/system-metadata/admin-onboarding", oazapfts.json({
        ...opts,
        method: "POST",
        body: adminOnboardingUpdateDto
    })));
}
/**
 * Retrieve reverse geocoding state
 */
export function getReverseGeocodingState(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-metadata/reverse-geocoding-state", {
        ...opts
    }));
}
/**
 * Retrieve version check state
 */
export function getVersionCheckState(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/system-metadata/version-check-state", {
        ...opts
    }));
}
/**
 * Retrieve tags
 */
export function getAllTags(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/tags", {
        ...opts
    }));
}
/**
 * Create a tag
 */
export function createTag({ tagCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/tags", oazapfts.json({
        ...opts,
        method: "POST",
        body: tagCreateDto
    })));
}
/**
 * Upsert tags
 */
export function upsertTags({ tagUpsertDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/tags", oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagUpsertDto
    })));
}
/**
 * Tag assets
 */
export function bulkTagAssets({ tagBulkAssetsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/tags/assets", oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagBulkAssetsDto
    })));
}
/**
 * Delete a tag
 */
export function deleteTag({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/tags/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a tag
 */
export function getTagById({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/tags/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a tag
 */
export function updateTag({ id, tagUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/tags/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: tagUpdateDto
    })));
}
/**
 * Untag assets
 */
export function untagAssets({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body: bulkIdsDto
    })));
}
/**
 * Tag assets
 */
export function tagAssets({ id, bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/tags/${encodeURIComponent(id)}/assets`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: bulkIdsDto
    })));
}
/**
 * Get time bucket
 */
export function getTimeBucket({ albumId, bbox, isFavorite, isTrashed, key, order, personId, slug, tagId, timeBucket, userId, visibility, withCoordinates, withPartners, withStacked }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/timeline/bucket${QS.query(QS.explode({
        albumId,
        bbox,
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
export function getTimeBuckets({ albumId, bbox, isFavorite, isTrashed, key, order, personId, slug, tagId, userId, visibility, withCoordinates, withPartners, withStacked }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/timeline/buckets${QS.query(QS.explode({
        albumId,
        bbox,
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
export function emptyTrash(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/trash/empty", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Restore trash
 */
export function restoreTrash(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/trash/restore", {
        ...opts,
        method: "POST"
    }));
}
/**
 * Restore assets
 */
export function restoreAssets({ bulkIdsDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/trash/restore/assets", oazapfts.json({
        ...opts,
        method: "POST",
        body: bulkIdsDto
    })));
}
/**
 * Get all users
 */
export function searchUsers(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users", {
        ...opts
    }));
}
/**
 * Get current user
 */
export function getMyUser(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me", {
        ...opts
    }));
}
/**
 * Update current user
 */
export function updateMyUser({ userUpdateMeDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me", oazapfts.json({
        ...opts,
        method: "PUT",
        body: userUpdateMeDto
    })));
}
/**
 * Delete user product key
 */
export function deleteUserLicense(opts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/license", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve user product key
 */
export function getUserLicense(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/license", {
        ...opts
    }));
}
/**
 * Set user product key
 */
export function setUserLicense({ licenseKeyDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/license", oazapfts.json({
        ...opts,
        method: "PUT",
        body: licenseKeyDto
    })));
}
/**
 * Delete user onboarding
 */
export function deleteUserOnboarding(opts) {
    return oazapfts.ok(oazapfts.fetchText("/users/me/onboarding", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve user onboarding
 */
export function getUserOnboarding(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/onboarding", {
        ...opts
    }));
}
/**
 * Update user onboarding
 */
export function setUserOnboarding({ onboardingDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/onboarding", oazapfts.json({
        ...opts,
        method: "PUT",
        body: onboardingDto
    })));
}
/**
 * Get my preferences
 */
export function getMyPreferences(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/preferences", {
        ...opts
    }));
}
/**
 * Update my preferences
 */
export function updateMyPreferences({ userPreferencesUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/me/preferences", oazapfts.json({
        ...opts,
        method: "PUT",
        body: userPreferencesUpdateDto
    })));
}
/**
 * Delete user profile image
 */
export function deleteProfileImage(opts) {
    return oazapfts.ok(oazapfts.fetchText("/users/profile-image", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Create user profile image
 */
export function createProfileImage({ createProfileImageDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/users/profile-image", oazapfts.multipart({
        ...opts,
        method: "POST",
        body: createProfileImageDto
    })));
}
/**
 * Retrieve a user
 */
export function getUser({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/users/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Retrieve user profile image
 */
export function getProfileImage({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchBlob(`/users/${encodeURIComponent(id)}/profile-image`, {
        ...opts
    }));
}
/**
 * Retrieve assets by original path
 */
export function getAssetsByOriginalPath({ path }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/view/folder${QS.query(QS.explode({
        path
    }))}`, {
        ...opts
    }));
}
/**
 * Retrieve unique paths
 */
export function getUniqueOriginalPaths(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/view/folder/unique-paths", {
        ...opts
    }));
}
/**
 * List all workflows
 */
export function getWorkflows(opts) {
    return oazapfts.ok(oazapfts.fetchJson("/workflows", {
        ...opts
    }));
}
/**
 * Create a workflow
 */
export function createWorkflow({ workflowCreateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson("/workflows", oazapfts.json({
        ...opts,
        method: "POST",
        body: workflowCreateDto
    })));
}
/**
 * Delete a workflow
 */
export function deleteWorkflow({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchText(`/workflows/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Retrieve a workflow
 */
export function getWorkflow({ id }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/workflows/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update a workflow
 */
export function updateWorkflow({ id, workflowUpdateDto }, opts) {
    return oazapfts.ok(oazapfts.fetchJson(`/workflows/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: workflowUpdateDto
    })));
}
export var ReactionLevel;
(function (ReactionLevel) {
    ReactionLevel["Album"] = "album";
    ReactionLevel["Asset"] = "asset";
})(ReactionLevel || (ReactionLevel = {}));
export var ReactionType;
(function (ReactionType) {
    ReactionType["Comment"] = "comment";
    ReactionType["Like"] = "like";
})(ReactionType || (ReactionType = {}));
export var UserAvatarColor;
(function (UserAvatarColor) {
    UserAvatarColor["Primary"] = "primary";
    UserAvatarColor["Pink"] = "pink";
    UserAvatarColor["Red"] = "red";
    UserAvatarColor["Yellow"] = "yellow";
    UserAvatarColor["Blue"] = "blue";
    UserAvatarColor["Green"] = "green";
    UserAvatarColor["Purple"] = "purple";
    UserAvatarColor["Orange"] = "orange";
    UserAvatarColor["Gray"] = "gray";
    UserAvatarColor["Amber"] = "amber";
})(UserAvatarColor || (UserAvatarColor = {}));
export var MaintenanceAction;
(function (MaintenanceAction) {
    MaintenanceAction["Start"] = "start";
    MaintenanceAction["End"] = "end";
    MaintenanceAction["SelectDatabaseRestore"] = "select_database_restore";
    MaintenanceAction["RestoreDatabase"] = "restore_database";
})(MaintenanceAction || (MaintenanceAction = {}));
export var StorageFolder;
(function (StorageFolder) {
    StorageFolder["EncodedVideo"] = "encoded-video";
    StorageFolder["Library"] = "library";
    StorageFolder["Upload"] = "upload";
    StorageFolder["Profile"] = "profile";
    StorageFolder["Thumbs"] = "thumbs";
    StorageFolder["Backups"] = "backups";
})(StorageFolder || (StorageFolder = {}));
export var NotificationLevel;
(function (NotificationLevel) {
    NotificationLevel["Success"] = "success";
    NotificationLevel["Error"] = "error";
    NotificationLevel["Warning"] = "warning";
    NotificationLevel["Info"] = "info";
})(NotificationLevel || (NotificationLevel = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["JobFailed"] = "JobFailed";
    NotificationType["BackupFailed"] = "BackupFailed";
    NotificationType["SystemMessage"] = "SystemMessage";
    NotificationType["AlbumInvite"] = "AlbumInvite";
    NotificationType["AlbumUpdate"] = "AlbumUpdate";
    NotificationType["Custom"] = "Custom";
})(NotificationType || (NotificationType = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["Active"] = "active";
    UserStatus["Removing"] = "removing";
    UserStatus["Deleted"] = "deleted";
})(UserStatus || (UserStatus = {}));
export var AssetOrder;
(function (AssetOrder) {
    AssetOrder["Asc"] = "asc";
    AssetOrder["Desc"] = "desc";
})(AssetOrder || (AssetOrder = {}));
export var AssetVisibility;
(function (AssetVisibility) {
    AssetVisibility["Archive"] = "archive";
    AssetVisibility["Timeline"] = "timeline";
    AssetVisibility["Hidden"] = "hidden";
    AssetVisibility["Locked"] = "locked";
})(AssetVisibility || (AssetVisibility = {}));
export var AlbumUserRole;
(function (AlbumUserRole) {
    AlbumUserRole["Editor"] = "editor";
    AlbumUserRole["Owner"] = "owner";
    AlbumUserRole["Viewer"] = "viewer";
})(AlbumUserRole || (AlbumUserRole = {}));
export var BulkIdErrorReason;
(function (BulkIdErrorReason) {
    BulkIdErrorReason["Duplicate"] = "duplicate";
    BulkIdErrorReason["NoPermission"] = "no_permission";
    BulkIdErrorReason["NotFound"] = "not_found";
    BulkIdErrorReason["Unknown"] = "unknown";
    BulkIdErrorReason["Validation"] = "validation";
})(BulkIdErrorReason || (BulkIdErrorReason = {}));
export var Permission;
(function (Permission) {
    Permission["All"] = "all";
    Permission["ActivityCreate"] = "activity.create";
    Permission["ActivityRead"] = "activity.read";
    Permission["ActivityUpdate"] = "activity.update";
    Permission["ActivityDelete"] = "activity.delete";
    Permission["ActivityStatistics"] = "activity.statistics";
    Permission["ApiKeyCreate"] = "apiKey.create";
    Permission["ApiKeyRead"] = "apiKey.read";
    Permission["ApiKeyUpdate"] = "apiKey.update";
    Permission["ApiKeyDelete"] = "apiKey.delete";
    Permission["AssetRead"] = "asset.read";
    Permission["AssetUpdate"] = "asset.update";
    Permission["AssetDelete"] = "asset.delete";
    Permission["AssetStatistics"] = "asset.statistics";
    Permission["AssetShare"] = "asset.share";
    Permission["AssetView"] = "asset.view";
    Permission["AssetDownload"] = "asset.download";
    Permission["AssetUpload"] = "asset.upload";
    Permission["AssetCopy"] = "asset.copy";
    Permission["AssetDerive"] = "asset.derive";
    Permission["AssetEditGet"] = "asset.edit.get";
    Permission["AssetEditCreate"] = "asset.edit.create";
    Permission["AssetEditDelete"] = "asset.edit.delete";
    Permission["AlbumCreate"] = "album.create";
    Permission["AlbumRead"] = "album.read";
    Permission["AlbumUpdate"] = "album.update";
    Permission["AlbumDelete"] = "album.delete";
    Permission["AlbumStatistics"] = "album.statistics";
    Permission["AlbumShare"] = "album.share";
    Permission["AlbumDownload"] = "album.download";
    Permission["AlbumAssetCreate"] = "albumAsset.create";
    Permission["AlbumAssetDelete"] = "albumAsset.delete";
    Permission["AlbumUserCreate"] = "albumUser.create";
    Permission["AlbumUserUpdate"] = "albumUser.update";
    Permission["AlbumUserDelete"] = "albumUser.delete";
    Permission["AuthChangePassword"] = "auth.changePassword";
    Permission["AuthDeviceDelete"] = "authDevice.delete";
    Permission["ArchiveRead"] = "archive.read";
    Permission["BackupList"] = "backup.list";
    Permission["BackupDownload"] = "backup.download";
    Permission["BackupUpload"] = "backup.upload";
    Permission["BackupDelete"] = "backup.delete";
    Permission["DuplicateRead"] = "duplicate.read";
    Permission["DuplicateDelete"] = "duplicate.delete";
    Permission["FaceCreate"] = "face.create";
    Permission["FaceRead"] = "face.read";
    Permission["FaceUpdate"] = "face.update";
    Permission["FaceDelete"] = "face.delete";
    Permission["FolderRead"] = "folder.read";
    Permission["JobCreate"] = "job.create";
    Permission["JobRead"] = "job.read";
    Permission["LibraryCreate"] = "library.create";
    Permission["LibraryRead"] = "library.read";
    Permission["LibraryUpdate"] = "library.update";
    Permission["LibraryDelete"] = "library.delete";
    Permission["LibraryStatistics"] = "library.statistics";
    Permission["TimelineRead"] = "timeline.read";
    Permission["TimelineDownload"] = "timeline.download";
    Permission["Maintenance"] = "maintenance";
    Permission["MapRead"] = "map.read";
    Permission["MapSearch"] = "map.search";
    Permission["MemoryCreate"] = "memory.create";
    Permission["MemoryRead"] = "memory.read";
    Permission["MemoryUpdate"] = "memory.update";
    Permission["MemoryDelete"] = "memory.delete";
    Permission["MemoryStatistics"] = "memory.statistics";
    Permission["MemoryAssetCreate"] = "memoryAsset.create";
    Permission["MemoryAssetDelete"] = "memoryAsset.delete";
    Permission["NotificationCreate"] = "notification.create";
    Permission["NotificationRead"] = "notification.read";
    Permission["NotificationUpdate"] = "notification.update";
    Permission["NotificationDelete"] = "notification.delete";
    Permission["PartnerCreate"] = "partner.create";
    Permission["PartnerRead"] = "partner.read";
    Permission["PartnerUpdate"] = "partner.update";
    Permission["PartnerDelete"] = "partner.delete";
    Permission["PersonCreate"] = "person.create";
    Permission["PersonRead"] = "person.read";
    Permission["PersonUpdate"] = "person.update";
    Permission["PersonDelete"] = "person.delete";
    Permission["PersonStatistics"] = "person.statistics";
    Permission["PersonMerge"] = "person.merge";
    Permission["PersonReassign"] = "person.reassign";
    Permission["PinCodeCreate"] = "pinCode.create";
    Permission["PinCodeUpdate"] = "pinCode.update";
    Permission["PinCodeDelete"] = "pinCode.delete";
    Permission["PluginCreate"] = "plugin.create";
    Permission["PluginRead"] = "plugin.read";
    Permission["PluginUpdate"] = "plugin.update";
    Permission["PluginDelete"] = "plugin.delete";
    Permission["ServerAbout"] = "server.about";
    Permission["ServerApkLinks"] = "server.apkLinks";
    Permission["ServerStorage"] = "server.storage";
    Permission["ServerStatistics"] = "server.statistics";
    Permission["ServerVersionCheck"] = "server.versionCheck";
    Permission["ServerLicenseRead"] = "serverLicense.read";
    Permission["ServerLicenseUpdate"] = "serverLicense.update";
    Permission["ServerLicenseDelete"] = "serverLicense.delete";
    Permission["SessionCreate"] = "session.create";
    Permission["SessionRead"] = "session.read";
    Permission["SessionUpdate"] = "session.update";
    Permission["SessionDelete"] = "session.delete";
    Permission["SessionLock"] = "session.lock";
    Permission["SharedLinkCreate"] = "sharedLink.create";
    Permission["SharedLinkRead"] = "sharedLink.read";
    Permission["SharedLinkUpdate"] = "sharedLink.update";
    Permission["SharedLinkDelete"] = "sharedLink.delete";
    Permission["StackCreate"] = "stack.create";
    Permission["StackRead"] = "stack.read";
    Permission["StackUpdate"] = "stack.update";
    Permission["StackDelete"] = "stack.delete";
    Permission["SyncStream"] = "sync.stream";
    Permission["SyncCheckpointRead"] = "syncCheckpoint.read";
    Permission["SyncCheckpointUpdate"] = "syncCheckpoint.update";
    Permission["SyncCheckpointDelete"] = "syncCheckpoint.delete";
    Permission["SystemConfigRead"] = "systemConfig.read";
    Permission["SystemConfigUpdate"] = "systemConfig.update";
    Permission["SystemMetadataRead"] = "systemMetadata.read";
    Permission["SystemMetadataUpdate"] = "systemMetadata.update";
    Permission["TagCreate"] = "tag.create";
    Permission["TagRead"] = "tag.read";
    Permission["TagUpdate"] = "tag.update";
    Permission["TagDelete"] = "tag.delete";
    Permission["TagAsset"] = "tag.asset";
    Permission["UserRead"] = "user.read";
    Permission["UserUpdate"] = "user.update";
    Permission["UserLicenseCreate"] = "userLicense.create";
    Permission["UserLicenseRead"] = "userLicense.read";
    Permission["UserLicenseUpdate"] = "userLicense.update";
    Permission["UserLicenseDelete"] = "userLicense.delete";
    Permission["UserOnboardingRead"] = "userOnboarding.read";
    Permission["UserOnboardingUpdate"] = "userOnboarding.update";
    Permission["UserOnboardingDelete"] = "userOnboarding.delete";
    Permission["UserPreferenceRead"] = "userPreference.read";
    Permission["UserPreferenceUpdate"] = "userPreference.update";
    Permission["UserProfileImageCreate"] = "userProfileImage.create";
    Permission["UserProfileImageRead"] = "userProfileImage.read";
    Permission["UserProfileImageUpdate"] = "userProfileImage.update";
    Permission["UserProfileImageDelete"] = "userProfileImage.delete";
    Permission["QueueRead"] = "queue.read";
    Permission["QueueUpdate"] = "queue.update";
    Permission["QueueJobCreate"] = "queueJob.create";
    Permission["QueueJobRead"] = "queueJob.read";
    Permission["QueueJobUpdate"] = "queueJob.update";
    Permission["QueueJobDelete"] = "queueJob.delete";
    Permission["WorkflowCreate"] = "workflow.create";
    Permission["WorkflowRead"] = "workflow.read";
    Permission["WorkflowUpdate"] = "workflow.update";
    Permission["WorkflowDelete"] = "workflow.delete";
    Permission["AdminUserCreate"] = "adminUser.create";
    Permission["AdminUserRead"] = "adminUser.read";
    Permission["AdminUserUpdate"] = "adminUser.update";
    Permission["AdminUserDelete"] = "adminUser.delete";
    Permission["AdminSessionRead"] = "adminSession.read";
    Permission["AdminAuthUnlinkAll"] = "adminAuth.unlinkAll";
})(Permission || (Permission = {}));
export var AssetMediaStatus;
(function (AssetMediaStatus) {
    AssetMediaStatus["Created"] = "created";
    AssetMediaStatus["Duplicate"] = "duplicate";
})(AssetMediaStatus || (AssetMediaStatus = {}));
export var AssetUploadAction;
(function (AssetUploadAction) {
    AssetUploadAction["Accept"] = "accept";
    AssetUploadAction["Reject"] = "reject";
})(AssetUploadAction || (AssetUploadAction = {}));
export var AssetRejectReason;
(function (AssetRejectReason) {
    AssetRejectReason["Duplicate"] = "duplicate";
    AssetRejectReason["UnsupportedFormat"] = "unsupported-format";
})(AssetRejectReason || (AssetRejectReason = {}));
export var AssetJobName;
(function (AssetJobName) {
    AssetJobName["RefreshFaces"] = "refresh-faces";
    AssetJobName["RefreshMetadata"] = "refresh-metadata";
    AssetJobName["RegenerateThumbnail"] = "regenerate-thumbnail";
    AssetJobName["TranscodeVideo"] = "transcode-video";
})(AssetJobName || (AssetJobName = {}));
export var SourceType;
(function (SourceType) {
    SourceType["MachineLearning"] = "machine-learning";
    SourceType["Exif"] = "exif";
    SourceType["Manual"] = "manual";
})(SourceType || (SourceType = {}));
export var AssetTypeEnum;
(function (AssetTypeEnum) {
    AssetTypeEnum["Image"] = "IMAGE";
    AssetTypeEnum["Video"] = "VIDEO";
    AssetTypeEnum["Audio"] = "AUDIO";
    AssetTypeEnum["Other"] = "OTHER";
})(AssetTypeEnum || (AssetTypeEnum = {}));
export var AssetEditAction;
(function (AssetEditAction) {
    AssetEditAction["Crop"] = "crop";
    AssetEditAction["Rotate"] = "rotate";
    AssetEditAction["Mirror"] = "mirror";
})(AssetEditAction || (AssetEditAction = {}));
export var MirrorAxis;
(function (MirrorAxis) {
    MirrorAxis["Horizontal"] = "horizontal";
    MirrorAxis["Vertical"] = "vertical";
})(MirrorAxis || (MirrorAxis = {}));
export var AssetMediaSize;
(function (AssetMediaSize) {
    AssetMediaSize["Original"] = "original";
    AssetMediaSize["Fullsize"] = "fullsize";
    AssetMediaSize["Preview"] = "preview";
    AssetMediaSize["Thumbnail"] = "thumbnail";
})(AssetMediaSize || (AssetMediaSize = {}));
export var ManualJobName;
(function (ManualJobName) {
    ManualJobName["PersonCleanup"] = "person-cleanup";
    ManualJobName["TagCleanup"] = "tag-cleanup";
    ManualJobName["UserCleanup"] = "user-cleanup";
    ManualJobName["MemoryCleanup"] = "memory-cleanup";
    ManualJobName["MemoryCreate"] = "memory-create";
    ManualJobName["BackupDatabase"] = "backup-database";
})(ManualJobName || (ManualJobName = {}));
export var QueueName;
(function (QueueName) {
    QueueName["ThumbnailGeneration"] = "thumbnailGeneration";
    QueueName["MetadataExtraction"] = "metadataExtraction";
    QueueName["VideoConversion"] = "videoConversion";
    QueueName["FaceDetection"] = "faceDetection";
    QueueName["FacialRecognition"] = "facialRecognition";
    QueueName["SmartSearch"] = "smartSearch";
    QueueName["DuplicateDetection"] = "duplicateDetection";
    QueueName["BackgroundTask"] = "backgroundTask";
    QueueName["StorageTemplateMigration"] = "storageTemplateMigration";
    QueueName["Migration"] = "migration";
    QueueName["Search"] = "search";
    QueueName["Sidecar"] = "sidecar";
    QueueName["Library"] = "library";
    QueueName["Notifications"] = "notifications";
    QueueName["BackupDatabase"] = "backupDatabase";
    QueueName["Ocr"] = "ocr";
    QueueName["Workflow"] = "workflow";
    QueueName["Editor"] = "editor";
})(QueueName || (QueueName = {}));
export var QueueCommand;
(function (QueueCommand) {
    QueueCommand["Start"] = "start";
    QueueCommand["Pause"] = "pause";
    QueueCommand["Resume"] = "resume";
    QueueCommand["Empty"] = "empty";
    QueueCommand["ClearFailed"] = "clear-failed";
})(QueueCommand || (QueueCommand = {}));
export var MemorySearchOrder;
(function (MemorySearchOrder) {
    MemorySearchOrder["Asc"] = "asc";
    MemorySearchOrder["Desc"] = "desc";
    MemorySearchOrder["Random"] = "random";
})(MemorySearchOrder || (MemorySearchOrder = {}));
export var MemoryType;
(function (MemoryType) {
    MemoryType["OnThisDay"] = "on_this_day";
})(MemoryType || (MemoryType = {}));
export var PartnerDirection;
(function (PartnerDirection) {
    PartnerDirection["SharedBy"] = "shared-by";
    PartnerDirection["SharedWith"] = "shared-with";
})(PartnerDirection || (PartnerDirection = {}));
export var PluginJsonSchemaType;
(function (PluginJsonSchemaType) {
    PluginJsonSchemaType["String"] = "string";
    PluginJsonSchemaType["Number"] = "number";
    PluginJsonSchemaType["Integer"] = "integer";
    PluginJsonSchemaType["Boolean"] = "boolean";
    PluginJsonSchemaType["Object"] = "object";
    PluginJsonSchemaType["Array"] = "array";
    PluginJsonSchemaType["Null"] = "null";
})(PluginJsonSchemaType || (PluginJsonSchemaType = {}));
export var PluginContextType;
(function (PluginContextType) {
    PluginContextType["Asset"] = "asset";
    PluginContextType["Album"] = "album";
    PluginContextType["Person"] = "person";
})(PluginContextType || (PluginContextType = {}));
export var PluginTriggerType;
(function (PluginTriggerType) {
    PluginTriggerType["AssetCreate"] = "AssetCreate";
    PluginTriggerType["PersonRecognized"] = "PersonRecognized";
})(PluginTriggerType || (PluginTriggerType = {}));
export var QueueJobStatus;
(function (QueueJobStatus) {
    QueueJobStatus["Active"] = "active";
    QueueJobStatus["Failed"] = "failed";
    QueueJobStatus["Completed"] = "completed";
    QueueJobStatus["Delayed"] = "delayed";
    QueueJobStatus["Waiting"] = "waiting";
    QueueJobStatus["Paused"] = "paused";
})(QueueJobStatus || (QueueJobStatus = {}));
export var JobName;
(function (JobName) {
    JobName["AssetDelete"] = "AssetDelete";
    JobName["AssetDeleteCheck"] = "AssetDeleteCheck";
    JobName["AssetDetectFacesQueueAll"] = "AssetDetectFacesQueueAll";
    JobName["AssetDetectFaces"] = "AssetDetectFaces";
    JobName["AssetDetectDuplicatesQueueAll"] = "AssetDetectDuplicatesQueueAll";
    JobName["AssetDetectDuplicates"] = "AssetDetectDuplicates";
    JobName["AssetEditThumbnailGeneration"] = "AssetEditThumbnailGeneration";
    JobName["AssetEncodeVideoQueueAll"] = "AssetEncodeVideoQueueAll";
    JobName["AssetEncodeVideo"] = "AssetEncodeVideo";
    JobName["AssetEmptyTrash"] = "AssetEmptyTrash";
    JobName["AssetExtractMetadataQueueAll"] = "AssetExtractMetadataQueueAll";
    JobName["AssetExtractMetadata"] = "AssetExtractMetadata";
    JobName["AssetFileMigration"] = "AssetFileMigration";
    JobName["AssetGenerateThumbnailsQueueAll"] = "AssetGenerateThumbnailsQueueAll";
    JobName["AssetGenerateThumbnails"] = "AssetGenerateThumbnails";
    JobName["AuditTableCleanup"] = "AuditTableCleanup";
    JobName["DatabaseBackup"] = "DatabaseBackup";
    JobName["FacialRecognitionQueueAll"] = "FacialRecognitionQueueAll";
    JobName["FacialRecognition"] = "FacialRecognition";
    JobName["FileDelete"] = "FileDelete";
    JobName["FileMigrationQueueAll"] = "FileMigrationQueueAll";
    JobName["LibraryDeleteCheck"] = "LibraryDeleteCheck";
    JobName["LibraryDelete"] = "LibraryDelete";
    JobName["LibraryRemoveAsset"] = "LibraryRemoveAsset";
    JobName["LibraryScanAssetsQueueAll"] = "LibraryScanAssetsQueueAll";
    JobName["LibrarySyncAssets"] = "LibrarySyncAssets";
    JobName["LibrarySyncFilesQueueAll"] = "LibrarySyncFilesQueueAll";
    JobName["LibrarySyncFiles"] = "LibrarySyncFiles";
    JobName["LibraryScanQueueAll"] = "LibraryScanQueueAll";
    JobName["MemoryCleanup"] = "MemoryCleanup";
    JobName["MemoryGenerate"] = "MemoryGenerate";
    JobName["NotificationsCleanup"] = "NotificationsCleanup";
    JobName["NotifyUserSignup"] = "NotifyUserSignup";
    JobName["NotifyAlbumInvite"] = "NotifyAlbumInvite";
    JobName["NotifyAlbumUpdate"] = "NotifyAlbumUpdate";
    JobName["UserDelete"] = "UserDelete";
    JobName["UserDeleteCheck"] = "UserDeleteCheck";
    JobName["UserSyncUsage"] = "UserSyncUsage";
    JobName["PersonCleanup"] = "PersonCleanup";
    JobName["PersonFileMigration"] = "PersonFileMigration";
    JobName["PersonGenerateThumbnail"] = "PersonGenerateThumbnail";
    JobName["SessionCleanup"] = "SessionCleanup";
    JobName["SendMail"] = "SendMail";
    JobName["SidecarQueueAll"] = "SidecarQueueAll";
    JobName["SidecarCheck"] = "SidecarCheck";
    JobName["SidecarWrite"] = "SidecarWrite";
    JobName["SmartSearchQueueAll"] = "SmartSearchQueueAll";
    JobName["SmartSearch"] = "SmartSearch";
    JobName["StorageTemplateMigration"] = "StorageTemplateMigration";
    JobName["StorageTemplateMigrationSingle"] = "StorageTemplateMigrationSingle";
    JobName["TagCleanup"] = "TagCleanup";
    JobName["VersionCheck"] = "VersionCheck";
    JobName["OcrQueueAll"] = "OcrQueueAll";
    JobName["Ocr"] = "Ocr";
    JobName["WorkflowRun"] = "WorkflowRun";
})(JobName || (JobName = {}));
export var SearchSuggestionType;
(function (SearchSuggestionType) {
    SearchSuggestionType["Country"] = "country";
    SearchSuggestionType["State"] = "state";
    SearchSuggestionType["City"] = "city";
    SearchSuggestionType["CameraMake"] = "camera-make";
    SearchSuggestionType["CameraModel"] = "camera-model";
    SearchSuggestionType["CameraLensModel"] = "camera-lens-model";
})(SearchSuggestionType || (SearchSuggestionType = {}));
export var SharedLinkType;
(function (SharedLinkType) {
    SharedLinkType["Album"] = "ALBUM";
    SharedLinkType["Individual"] = "INDIVIDUAL";
})(SharedLinkType || (SharedLinkType = {}));
export var AssetIdErrorReason;
(function (AssetIdErrorReason) {
    AssetIdErrorReason["Duplicate"] = "duplicate";
    AssetIdErrorReason["NoPermission"] = "no_permission";
    AssetIdErrorReason["NotFound"] = "not_found";
})(AssetIdErrorReason || (AssetIdErrorReason = {}));
export var SyncEntityType;
(function (SyncEntityType) {
    SyncEntityType["AuthUserV1"] = "AuthUserV1";
    SyncEntityType["UserV1"] = "UserV1";
    SyncEntityType["UserDeleteV1"] = "UserDeleteV1";
    SyncEntityType["AssetV1"] = "AssetV1";
    SyncEntityType["AssetDeleteV1"] = "AssetDeleteV1";
    SyncEntityType["AssetExifV1"] = "AssetExifV1";
    SyncEntityType["AssetEditV1"] = "AssetEditV1";
    SyncEntityType["AssetEditDeleteV1"] = "AssetEditDeleteV1";
    SyncEntityType["AssetMetadataV1"] = "AssetMetadataV1";
    SyncEntityType["AssetMetadataDeleteV1"] = "AssetMetadataDeleteV1";
    SyncEntityType["PartnerV1"] = "PartnerV1";
    SyncEntityType["PartnerDeleteV1"] = "PartnerDeleteV1";
    SyncEntityType["PartnerAssetV1"] = "PartnerAssetV1";
    SyncEntityType["PartnerAssetBackfillV1"] = "PartnerAssetBackfillV1";
    SyncEntityType["PartnerAssetDeleteV1"] = "PartnerAssetDeleteV1";
    SyncEntityType["PartnerAssetExifV1"] = "PartnerAssetExifV1";
    SyncEntityType["PartnerAssetExifBackfillV1"] = "PartnerAssetExifBackfillV1";
    SyncEntityType["PartnerStackBackfillV1"] = "PartnerStackBackfillV1";
    SyncEntityType["PartnerStackDeleteV1"] = "PartnerStackDeleteV1";
    SyncEntityType["PartnerStackV1"] = "PartnerStackV1";
    SyncEntityType["AlbumV1"] = "AlbumV1";
    SyncEntityType["AlbumV2"] = "AlbumV2";
    SyncEntityType["AlbumDeleteV1"] = "AlbumDeleteV1";
    SyncEntityType["AlbumUserV1"] = "AlbumUserV1";
    SyncEntityType["AlbumUserBackfillV1"] = "AlbumUserBackfillV1";
    SyncEntityType["AlbumUserDeleteV1"] = "AlbumUserDeleteV1";
    SyncEntityType["AlbumAssetCreateV1"] = "AlbumAssetCreateV1";
    SyncEntityType["AlbumAssetUpdateV1"] = "AlbumAssetUpdateV1";
    SyncEntityType["AlbumAssetBackfillV1"] = "AlbumAssetBackfillV1";
    SyncEntityType["AlbumAssetExifCreateV1"] = "AlbumAssetExifCreateV1";
    SyncEntityType["AlbumAssetExifUpdateV1"] = "AlbumAssetExifUpdateV1";
    SyncEntityType["AlbumAssetExifBackfillV1"] = "AlbumAssetExifBackfillV1";
    SyncEntityType["AlbumToAssetV1"] = "AlbumToAssetV1";
    SyncEntityType["AlbumToAssetDeleteV1"] = "AlbumToAssetDeleteV1";
    SyncEntityType["AlbumToAssetBackfillV1"] = "AlbumToAssetBackfillV1";
    SyncEntityType["MemoryV1"] = "MemoryV1";
    SyncEntityType["MemoryDeleteV1"] = "MemoryDeleteV1";
    SyncEntityType["MemoryToAssetV1"] = "MemoryToAssetV1";
    SyncEntityType["MemoryToAssetDeleteV1"] = "MemoryToAssetDeleteV1";
    SyncEntityType["StackV1"] = "StackV1";
    SyncEntityType["StackDeleteV1"] = "StackDeleteV1";
    SyncEntityType["PersonV1"] = "PersonV1";
    SyncEntityType["PersonDeleteV1"] = "PersonDeleteV1";
    SyncEntityType["AssetFaceV1"] = "AssetFaceV1";
    SyncEntityType["AssetFaceV2"] = "AssetFaceV2";
    SyncEntityType["AssetFaceDeleteV1"] = "AssetFaceDeleteV1";
    SyncEntityType["UserMetadataV1"] = "UserMetadataV1";
    SyncEntityType["UserMetadataDeleteV1"] = "UserMetadataDeleteV1";
    SyncEntityType["SyncAckV1"] = "SyncAckV1";
    SyncEntityType["SyncResetV1"] = "SyncResetV1";
    SyncEntityType["SyncCompleteV1"] = "SyncCompleteV1";
})(SyncEntityType || (SyncEntityType = {}));
export var SyncRequestType;
(function (SyncRequestType) {
    SyncRequestType["AlbumsV1"] = "AlbumsV1";
    SyncRequestType["AlbumsV2"] = "AlbumsV2";
    SyncRequestType["AlbumUsersV1"] = "AlbumUsersV1";
    SyncRequestType["AlbumToAssetsV1"] = "AlbumToAssetsV1";
    SyncRequestType["AlbumAssetsV1"] = "AlbumAssetsV1";
    SyncRequestType["AlbumAssetExifsV1"] = "AlbumAssetExifsV1";
    SyncRequestType["AssetsV1"] = "AssetsV1";
    SyncRequestType["AssetExifsV1"] = "AssetExifsV1";
    SyncRequestType["AssetEditsV1"] = "AssetEditsV1";
    SyncRequestType["AssetMetadataV1"] = "AssetMetadataV1";
    SyncRequestType["AuthUsersV1"] = "AuthUsersV1";
    SyncRequestType["MemoriesV1"] = "MemoriesV1";
    SyncRequestType["MemoryToAssetsV1"] = "MemoryToAssetsV1";
    SyncRequestType["PartnersV1"] = "PartnersV1";
    SyncRequestType["PartnerAssetsV1"] = "PartnerAssetsV1";
    SyncRequestType["PartnerAssetExifsV1"] = "PartnerAssetExifsV1";
    SyncRequestType["PartnerStacksV1"] = "PartnerStacksV1";
    SyncRequestType["StacksV1"] = "StacksV1";
    SyncRequestType["UsersV1"] = "UsersV1";
    SyncRequestType["PeopleV1"] = "PeopleV1";
    SyncRequestType["AssetFacesV1"] = "AssetFacesV1";
    SyncRequestType["AssetFacesV2"] = "AssetFacesV2";
    SyncRequestType["UserMetadataV1"] = "UserMetadataV1";
})(SyncRequestType || (SyncRequestType = {}));
export var TranscodeHWAccel;
(function (TranscodeHWAccel) {
    TranscodeHWAccel["Nvenc"] = "nvenc";
    TranscodeHWAccel["Qsv"] = "qsv";
    TranscodeHWAccel["Vaapi"] = "vaapi";
    TranscodeHWAccel["Rkmpp"] = "rkmpp";
    TranscodeHWAccel["Disabled"] = "disabled";
})(TranscodeHWAccel || (TranscodeHWAccel = {}));
export var AudioCodec;
(function (AudioCodec) {
    AudioCodec["Mp3"] = "mp3";
    AudioCodec["Aac"] = "aac";
    AudioCodec["Libopus"] = "libopus";
    AudioCodec["Opus"] = "opus";
    AudioCodec["PcmS16Le"] = "pcm_s16le";
})(AudioCodec || (AudioCodec = {}));
export var VideoContainer;
(function (VideoContainer) {
    VideoContainer["Mov"] = "mov";
    VideoContainer["Mp4"] = "mp4";
    VideoContainer["Ogg"] = "ogg";
    VideoContainer["Webm"] = "webm";
})(VideoContainer || (VideoContainer = {}));
export var VideoCodec;
(function (VideoCodec) {
    VideoCodec["H264"] = "h264";
    VideoCodec["Hevc"] = "hevc";
    VideoCodec["Vp9"] = "vp9";
    VideoCodec["Av1"] = "av1";
})(VideoCodec || (VideoCodec = {}));
export var CQMode;
(function (CQMode) {
    CQMode["Auto"] = "auto";
    CQMode["Cqp"] = "cqp";
    CQMode["Icq"] = "icq";
})(CQMode || (CQMode = {}));
export var ToneMapping;
(function (ToneMapping) {
    ToneMapping["Hable"] = "hable";
    ToneMapping["Mobius"] = "mobius";
    ToneMapping["Reinhard"] = "reinhard";
    ToneMapping["Disabled"] = "disabled";
})(ToneMapping || (ToneMapping = {}));
export var TranscodePolicy;
(function (TranscodePolicy) {
    TranscodePolicy["All"] = "all";
    TranscodePolicy["Optimal"] = "optimal";
    TranscodePolicy["Bitrate"] = "bitrate";
    TranscodePolicy["Required"] = "required";
    TranscodePolicy["Disabled"] = "disabled";
})(TranscodePolicy || (TranscodePolicy = {}));
export var Colorspace;
(function (Colorspace) {
    Colorspace["Srgb"] = "srgb";
    Colorspace["P3"] = "p3";
})(Colorspace || (Colorspace = {}));
export var ImageFormat;
(function (ImageFormat) {
    ImageFormat["Jpeg"] = "jpeg";
    ImageFormat["Webp"] = "webp";
})(ImageFormat || (ImageFormat = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["Verbose"] = "verbose";
    LogLevel["Debug"] = "debug";
    LogLevel["Log"] = "log";
    LogLevel["Warn"] = "warn";
    LogLevel["Error"] = "error";
    LogLevel["Fatal"] = "fatal";
})(LogLevel || (LogLevel = {}));
export var OAuthTokenEndpointAuthMethod;
(function (OAuthTokenEndpointAuthMethod) {
    OAuthTokenEndpointAuthMethod["ClientSecretPost"] = "client_secret_post";
    OAuthTokenEndpointAuthMethod["ClientSecretBasic"] = "client_secret_basic";
})(OAuthTokenEndpointAuthMethod || (OAuthTokenEndpointAuthMethod = {}));
export var UserMetadataKey;
(function (UserMetadataKey) {
    UserMetadataKey["Preferences"] = "preferences";
    UserMetadataKey["License"] = "license";
    UserMetadataKey["Onboarding"] = "onboarding";
})(UserMetadataKey || (UserMetadataKey = {}));
