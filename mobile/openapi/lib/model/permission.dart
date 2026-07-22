//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// List of permissions
enum Permission {
  all._(r'all'),
  activityPeriodCreate._(r'activity.create'),
  activityPeriodRead._(r'activity.read'),
  activityPeriodUpdate._(r'activity.update'),
  activityPeriodDelete._(r'activity.delete'),
  activityPeriodStatistics._(r'activity.statistics'),
  apiKeyPeriodCreate._(r'apiKey.create'),
  apiKeyPeriodRead._(r'apiKey.read'),
  apiKeyPeriodUpdate._(r'apiKey.update'),
  apiKeyPeriodDelete._(r'apiKey.delete'),
  assetPeriodRead._(r'asset.read'),
  assetPeriodUpdate._(r'asset.update'),
  assetPeriodDelete._(r'asset.delete'),
  assetPeriodStatistics._(r'asset.statistics'),
  assetPeriodShare._(r'asset.share'),
  assetPeriodView._(r'asset.view'),
  assetPeriodDownload._(r'asset.download'),
  assetPeriodUpload._(r'asset.upload'),
  assetPeriodCopy._(r'asset.copy'),
  assetPeriodDerive._(r'asset.derive'),
  assetPeriodEditPeriodGet._(r'asset.edit.get'),
  assetPeriodEditPeriodCreate._(r'asset.edit.create'),
  assetPeriodEditPeriodDelete._(r'asset.edit.delete'),
  albumPeriodCreate._(r'album.create'),
  albumPeriodRead._(r'album.read'),
  albumPeriodUpdate._(r'album.update'),
  albumPeriodDelete._(r'album.delete'),
  albumPeriodStatistics._(r'album.statistics'),
  albumPeriodShare._(r'album.share'),
  albumPeriodDownload._(r'album.download'),
  albumAssetPeriodCreate._(r'albumAsset.create'),
  albumAssetPeriodDelete._(r'albumAsset.delete'),
  albumUserPeriodCreate._(r'albumUser.create'),
  albumUserPeriodUpdate._(r'albumUser.update'),
  albumUserPeriodDelete._(r'albumUser.delete'),
  authPeriodChangePassword._(r'auth.changePassword'),
  authDevicePeriodDelete._(r'authDevice.delete'),
  archivePeriodRead._(r'archive.read'),
  backupPeriodList._(r'backup.list'),
  backupPeriodDownload._(r'backup.download'),
  backupPeriodUpload._(r'backup.upload'),
  backupPeriodDelete._(r'backup.delete'),
  duplicatePeriodRead._(r'duplicate.read'),
  duplicatePeriodDelete._(r'duplicate.delete'),
  facePeriodCreate._(r'face.create'),
  facePeriodRead._(r'face.read'),
  facePeriodUpdate._(r'face.update'),
  facePeriodDelete._(r'face.delete'),
  folderPeriodRead._(r'folder.read'),
  jobPeriodCreate._(r'job.create'),
  jobPeriodRead._(r'job.read'),
  libraryPeriodCreate._(r'library.create'),
  libraryPeriodRead._(r'library.read'),
  libraryPeriodUpdate._(r'library.update'),
  libraryPeriodDelete._(r'library.delete'),
  libraryPeriodStatistics._(r'library.statistics'),
  timelinePeriodRead._(r'timeline.read'),
  timelinePeriodDownload._(r'timeline.download'),
  maintenance._(r'maintenance'),
  mapPeriodRead._(r'map.read'),
  mapPeriodSearch._(r'map.search'),
  memoryPeriodCreate._(r'memory.create'),
  memoryPeriodRead._(r'memory.read'),
  memoryPeriodUpdate._(r'memory.update'),
  memoryPeriodDelete._(r'memory.delete'),
  memoryPeriodStatistics._(r'memory.statistics'),
  memoryAssetPeriodCreate._(r'memoryAsset.create'),
  memoryAssetPeriodDelete._(r'memoryAsset.delete'),
  notificationPeriodCreate._(r'notification.create'),
  notificationPeriodRead._(r'notification.read'),
  notificationPeriodUpdate._(r'notification.update'),
  notificationPeriodDelete._(r'notification.delete'),
  partnerPeriodCreate._(r'partner.create'),
  partnerPeriodRead._(r'partner.read'),
  partnerPeriodUpdate._(r'partner.update'),
  partnerPeriodDelete._(r'partner.delete'),
  personPeriodCreate._(r'person.create'),
  personPeriodRead._(r'person.read'),
  personPeriodUpdate._(r'person.update'),
  personPeriodDelete._(r'person.delete'),
  personPeriodStatistics._(r'person.statistics'),
  personPeriodMerge._(r'person.merge'),
  personPeriodReassign._(r'person.reassign'),
  pinCodePeriodCreate._(r'pinCode.create'),
  pinCodePeriodUpdate._(r'pinCode.update'),
  pinCodePeriodDelete._(r'pinCode.delete'),
  pluginPeriodCreate._(r'plugin.create'),
  pluginPeriodRead._(r'plugin.read'),
  pluginPeriodUpdate._(r'plugin.update'),
  pluginPeriodDelete._(r'plugin.delete'),
  serverPeriodAbout._(r'server.about'),
  serverPeriodApkLinks._(r'server.apkLinks'),
  serverPeriodStorage._(r'server.storage'),
  serverPeriodStatistics._(r'server.statistics'),
  serverPeriodVersionCheck._(r'server.versionCheck'),
  serverLicensePeriodRead._(r'serverLicense.read'),
  serverLicensePeriodUpdate._(r'serverLicense.update'),
  serverLicensePeriodDelete._(r'serverLicense.delete'),
  sessionPeriodCreate._(r'session.create'),
  sessionPeriodRead._(r'session.read'),
  sessionPeriodUpdate._(r'session.update'),
  sessionPeriodDelete._(r'session.delete'),
  sessionPeriodLock._(r'session.lock'),
  sharedLinkPeriodCreate._(r'sharedLink.create'),
  sharedLinkPeriodRead._(r'sharedLink.read'),
  sharedLinkPeriodUpdate._(r'sharedLink.update'),
  sharedLinkPeriodDelete._(r'sharedLink.delete'),
  stackPeriodCreate._(r'stack.create'),
  stackPeriodRead._(r'stack.read'),
  stackPeriodUpdate._(r'stack.update'),
  stackPeriodDelete._(r'stack.delete'),
  syncPeriodStream._(r'sync.stream'),
  syncCheckpointPeriodRead._(r'syncCheckpoint.read'),
  syncCheckpointPeriodUpdate._(r'syncCheckpoint.update'),
  syncCheckpointPeriodDelete._(r'syncCheckpoint.delete'),
  systemConfigPeriodRead._(r'systemConfig.read'),
  systemConfigPeriodUpdate._(r'systemConfig.update'),
  systemMetadataPeriodRead._(r'systemMetadata.read'),
  systemMetadataPeriodUpdate._(r'systemMetadata.update'),
  tagPeriodCreate._(r'tag.create'),
  tagPeriodRead._(r'tag.read'),
  tagPeriodUpdate._(r'tag.update'),
  tagPeriodDelete._(r'tag.delete'),
  tagPeriodAsset._(r'tag.asset'),
  userPeriodRead._(r'user.read'),
  userPeriodUpdate._(r'user.update'),
  userLicensePeriodCreate._(r'userLicense.create'),
  userLicensePeriodRead._(r'userLicense.read'),
  userLicensePeriodUpdate._(r'userLicense.update'),
  userLicensePeriodDelete._(r'userLicense.delete'),
  userOnboardingPeriodRead._(r'userOnboarding.read'),
  userOnboardingPeriodUpdate._(r'userOnboarding.update'),
  userOnboardingPeriodDelete._(r'userOnboarding.delete'),
  userPreferencePeriodRead._(r'userPreference.read'),
  userPreferencePeriodUpdate._(r'userPreference.update'),
  userProfileImagePeriodCreate._(r'userProfileImage.create'),
  userProfileImagePeriodRead._(r'userProfileImage.read'),
  userProfileImagePeriodUpdate._(r'userProfileImage.update'),
  userProfileImagePeriodDelete._(r'userProfileImage.delete'),
  queuePeriodRead._(r'queue.read'),
  queuePeriodUpdate._(r'queue.update'),
  queueJobPeriodCreate._(r'queueJob.create'),
  queueJobPeriodRead._(r'queueJob.read'),
  queueJobPeriodUpdate._(r'queueJob.update'),
  queueJobPeriodDelete._(r'queueJob.delete'),
  workflowPeriodCreate._(r'workflow.create'),
  workflowPeriodRead._(r'workflow.read'),
  workflowPeriodUpdate._(r'workflow.update'),
  workflowPeriodDelete._(r'workflow.delete'),
  adminUserPeriodCreate._(r'adminUser.create'),
  adminUserPeriodRead._(r'adminUser.read'),
  adminUserPeriodUpdate._(r'adminUser.update'),
  adminUserPeriodDelete._(r'adminUser.delete'),
  adminSessionPeriodRead._(r'adminSession.read'),
  adminAuthPeriodUnlinkAll._(r'adminAuth.unlinkAll'),
  ;

  /// Instantiate a new enum with the provided value.
  const Permission._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [Permission] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static Permission? fromJson(dynamic value) => PermissionTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [Permission]
  /// that were successfully decoded from the passed [JSON][json].
  static List<Permission> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Permission>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Permission.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [Permission] to String,
/// and [decode] dynamic data back to [Permission].
class PermissionTypeTransformer {
  factory PermissionTypeTransformer() => _instance ??= const PermissionTypeTransformer._();

  const PermissionTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(Permission data) => data._value;

  /// Returns the instance of [Permission] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  Permission? decode(dynamic data, {bool allowNull = true}) {
    if (data is Permission) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'all': return Permission.all;
        case r'activity.create': return Permission.activityPeriodCreate;
        case r'activity.read': return Permission.activityPeriodRead;
        case r'activity.update': return Permission.activityPeriodUpdate;
        case r'activity.delete': return Permission.activityPeriodDelete;
        case r'activity.statistics': return Permission.activityPeriodStatistics;
        case r'apiKey.create': return Permission.apiKeyPeriodCreate;
        case r'apiKey.read': return Permission.apiKeyPeriodRead;
        case r'apiKey.update': return Permission.apiKeyPeriodUpdate;
        case r'apiKey.delete': return Permission.apiKeyPeriodDelete;
        case r'asset.read': return Permission.assetPeriodRead;
        case r'asset.update': return Permission.assetPeriodUpdate;
        case r'asset.delete': return Permission.assetPeriodDelete;
        case r'asset.statistics': return Permission.assetPeriodStatistics;
        case r'asset.share': return Permission.assetPeriodShare;
        case r'asset.view': return Permission.assetPeriodView;
        case r'asset.download': return Permission.assetPeriodDownload;
        case r'asset.upload': return Permission.assetPeriodUpload;
        case r'asset.copy': return Permission.assetPeriodCopy;
        case r'asset.derive': return Permission.assetPeriodDerive;
        case r'asset.edit.get': return Permission.assetPeriodEditPeriodGet;
        case r'asset.edit.create': return Permission.assetPeriodEditPeriodCreate;
        case r'asset.edit.delete': return Permission.assetPeriodEditPeriodDelete;
        case r'album.create': return Permission.albumPeriodCreate;
        case r'album.read': return Permission.albumPeriodRead;
        case r'album.update': return Permission.albumPeriodUpdate;
        case r'album.delete': return Permission.albumPeriodDelete;
        case r'album.statistics': return Permission.albumPeriodStatistics;
        case r'album.share': return Permission.albumPeriodShare;
        case r'album.download': return Permission.albumPeriodDownload;
        case r'albumAsset.create': return Permission.albumAssetPeriodCreate;
        case r'albumAsset.delete': return Permission.albumAssetPeriodDelete;
        case r'albumUser.create': return Permission.albumUserPeriodCreate;
        case r'albumUser.update': return Permission.albumUserPeriodUpdate;
        case r'albumUser.delete': return Permission.albumUserPeriodDelete;
        case r'auth.changePassword': return Permission.authPeriodChangePassword;
        case r'authDevice.delete': return Permission.authDevicePeriodDelete;
        case r'archive.read': return Permission.archivePeriodRead;
        case r'backup.list': return Permission.backupPeriodList;
        case r'backup.download': return Permission.backupPeriodDownload;
        case r'backup.upload': return Permission.backupPeriodUpload;
        case r'backup.delete': return Permission.backupPeriodDelete;
        case r'duplicate.read': return Permission.duplicatePeriodRead;
        case r'duplicate.delete': return Permission.duplicatePeriodDelete;
        case r'face.create': return Permission.facePeriodCreate;
        case r'face.read': return Permission.facePeriodRead;
        case r'face.update': return Permission.facePeriodUpdate;
        case r'face.delete': return Permission.facePeriodDelete;
        case r'folder.read': return Permission.folderPeriodRead;
        case r'job.create': return Permission.jobPeriodCreate;
        case r'job.read': return Permission.jobPeriodRead;
        case r'library.create': return Permission.libraryPeriodCreate;
        case r'library.read': return Permission.libraryPeriodRead;
        case r'library.update': return Permission.libraryPeriodUpdate;
        case r'library.delete': return Permission.libraryPeriodDelete;
        case r'library.statistics': return Permission.libraryPeriodStatistics;
        case r'timeline.read': return Permission.timelinePeriodRead;
        case r'timeline.download': return Permission.timelinePeriodDownload;
        case r'maintenance': return Permission.maintenance;
        case r'map.read': return Permission.mapPeriodRead;
        case r'map.search': return Permission.mapPeriodSearch;
        case r'memory.create': return Permission.memoryPeriodCreate;
        case r'memory.read': return Permission.memoryPeriodRead;
        case r'memory.update': return Permission.memoryPeriodUpdate;
        case r'memory.delete': return Permission.memoryPeriodDelete;
        case r'memory.statistics': return Permission.memoryPeriodStatistics;
        case r'memoryAsset.create': return Permission.memoryAssetPeriodCreate;
        case r'memoryAsset.delete': return Permission.memoryAssetPeriodDelete;
        case r'notification.create': return Permission.notificationPeriodCreate;
        case r'notification.read': return Permission.notificationPeriodRead;
        case r'notification.update': return Permission.notificationPeriodUpdate;
        case r'notification.delete': return Permission.notificationPeriodDelete;
        case r'partner.create': return Permission.partnerPeriodCreate;
        case r'partner.read': return Permission.partnerPeriodRead;
        case r'partner.update': return Permission.partnerPeriodUpdate;
        case r'partner.delete': return Permission.partnerPeriodDelete;
        case r'person.create': return Permission.personPeriodCreate;
        case r'person.read': return Permission.personPeriodRead;
        case r'person.update': return Permission.personPeriodUpdate;
        case r'person.delete': return Permission.personPeriodDelete;
        case r'person.statistics': return Permission.personPeriodStatistics;
        case r'person.merge': return Permission.personPeriodMerge;
        case r'person.reassign': return Permission.personPeriodReassign;
        case r'pinCode.create': return Permission.pinCodePeriodCreate;
        case r'pinCode.update': return Permission.pinCodePeriodUpdate;
        case r'pinCode.delete': return Permission.pinCodePeriodDelete;
        case r'plugin.create': return Permission.pluginPeriodCreate;
        case r'plugin.read': return Permission.pluginPeriodRead;
        case r'plugin.update': return Permission.pluginPeriodUpdate;
        case r'plugin.delete': return Permission.pluginPeriodDelete;
        case r'server.about': return Permission.serverPeriodAbout;
        case r'server.apkLinks': return Permission.serverPeriodApkLinks;
        case r'server.storage': return Permission.serverPeriodStorage;
        case r'server.statistics': return Permission.serverPeriodStatistics;
        case r'server.versionCheck': return Permission.serverPeriodVersionCheck;
        case r'serverLicense.read': return Permission.serverLicensePeriodRead;
        case r'serverLicense.update': return Permission.serverLicensePeriodUpdate;
        case r'serverLicense.delete': return Permission.serverLicensePeriodDelete;
        case r'session.create': return Permission.sessionPeriodCreate;
        case r'session.read': return Permission.sessionPeriodRead;
        case r'session.update': return Permission.sessionPeriodUpdate;
        case r'session.delete': return Permission.sessionPeriodDelete;
        case r'session.lock': return Permission.sessionPeriodLock;
        case r'sharedLink.create': return Permission.sharedLinkPeriodCreate;
        case r'sharedLink.read': return Permission.sharedLinkPeriodRead;
        case r'sharedLink.update': return Permission.sharedLinkPeriodUpdate;
        case r'sharedLink.delete': return Permission.sharedLinkPeriodDelete;
        case r'stack.create': return Permission.stackPeriodCreate;
        case r'stack.read': return Permission.stackPeriodRead;
        case r'stack.update': return Permission.stackPeriodUpdate;
        case r'stack.delete': return Permission.stackPeriodDelete;
        case r'sync.stream': return Permission.syncPeriodStream;
        case r'syncCheckpoint.read': return Permission.syncCheckpointPeriodRead;
        case r'syncCheckpoint.update': return Permission.syncCheckpointPeriodUpdate;
        case r'syncCheckpoint.delete': return Permission.syncCheckpointPeriodDelete;
        case r'systemConfig.read': return Permission.systemConfigPeriodRead;
        case r'systemConfig.update': return Permission.systemConfigPeriodUpdate;
        case r'systemMetadata.read': return Permission.systemMetadataPeriodRead;
        case r'systemMetadata.update': return Permission.systemMetadataPeriodUpdate;
        case r'tag.create': return Permission.tagPeriodCreate;
        case r'tag.read': return Permission.tagPeriodRead;
        case r'tag.update': return Permission.tagPeriodUpdate;
        case r'tag.delete': return Permission.tagPeriodDelete;
        case r'tag.asset': return Permission.tagPeriodAsset;
        case r'user.read': return Permission.userPeriodRead;
        case r'user.update': return Permission.userPeriodUpdate;
        case r'userLicense.create': return Permission.userLicensePeriodCreate;
        case r'userLicense.read': return Permission.userLicensePeriodRead;
        case r'userLicense.update': return Permission.userLicensePeriodUpdate;
        case r'userLicense.delete': return Permission.userLicensePeriodDelete;
        case r'userOnboarding.read': return Permission.userOnboardingPeriodRead;
        case r'userOnboarding.update': return Permission.userOnboardingPeriodUpdate;
        case r'userOnboarding.delete': return Permission.userOnboardingPeriodDelete;
        case r'userPreference.read': return Permission.userPreferencePeriodRead;
        case r'userPreference.update': return Permission.userPreferencePeriodUpdate;
        case r'userProfileImage.create': return Permission.userProfileImagePeriodCreate;
        case r'userProfileImage.read': return Permission.userProfileImagePeriodRead;
        case r'userProfileImage.update': return Permission.userProfileImagePeriodUpdate;
        case r'userProfileImage.delete': return Permission.userProfileImagePeriodDelete;
        case r'queue.read': return Permission.queuePeriodRead;
        case r'queue.update': return Permission.queuePeriodUpdate;
        case r'queueJob.create': return Permission.queueJobPeriodCreate;
        case r'queueJob.read': return Permission.queueJobPeriodRead;
        case r'queueJob.update': return Permission.queueJobPeriodUpdate;
        case r'queueJob.delete': return Permission.queueJobPeriodDelete;
        case r'workflow.create': return Permission.workflowPeriodCreate;
        case r'workflow.read': return Permission.workflowPeriodRead;
        case r'workflow.update': return Permission.workflowPeriodUpdate;
        case r'workflow.delete': return Permission.workflowPeriodDelete;
        case r'adminUser.create': return Permission.adminUserPeriodCreate;
        case r'adminUser.read': return Permission.adminUserPeriodRead;
        case r'adminUser.update': return Permission.adminUserPeriodUpdate;
        case r'adminUser.delete': return Permission.adminUserPeriodDelete;
        case r'adminSession.read': return Permission.adminSessionPeriodRead;
        case r'adminAuth.unlinkAll': return Permission.adminAuthPeriodUnlinkAll;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static PermissionTypeTransformer? _instance;
}

