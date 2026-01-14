//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class Permission {
  /// Instantiate a new enum with the provided [value].
  const Permission._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = Permission._(r'all');
  static const activityPeriodCreate = Permission._(r'activity.create');
  static const activityPeriodRead = Permission._(r'activity.read');
  static const activityPeriodUpdate = Permission._(r'activity.update');
  static const activityPeriodDelete = Permission._(r'activity.delete');
  static const activityPeriodStatistics = Permission._(r'activity.statistics');
  static const apiKeyPeriodCreate = Permission._(r'apiKey.create');
  static const apiKeyPeriodRead = Permission._(r'apiKey.read');
  static const apiKeyPeriodUpdate = Permission._(r'apiKey.update');
  static const apiKeyPeriodDelete = Permission._(r'apiKey.delete');
  static const assetPeriodRead = Permission._(r'asset.read');
  static const assetPeriodUpdate = Permission._(r'asset.update');
  static const assetPeriodDelete = Permission._(r'asset.delete');
  static const assetPeriodStatistics = Permission._(r'asset.statistics');
  static const assetPeriodShare = Permission._(r'asset.share');
  static const assetPeriodView = Permission._(r'asset.view');
  static const assetPeriodDownload = Permission._(r'asset.download');
  static const assetPeriodUpload = Permission._(r'asset.upload');
  static const assetPeriodReplace = Permission._(r'asset.replace');
  static const assetPeriodCopy = Permission._(r'asset.copy');
  static const assetPeriodDerive = Permission._(r'asset.derive');
  static const assetPeriodEditPeriodGet = Permission._(r'asset.edit.get');
  static const assetPeriodEditPeriodCreate = Permission._(r'asset.edit.create');
  static const assetPeriodEditPeriodDelete = Permission._(r'asset.edit.delete');
  static const albumPeriodCreate = Permission._(r'album.create');
  static const albumPeriodRead = Permission._(r'album.read');
  static const albumPeriodUpdate = Permission._(r'album.update');
  static const albumPeriodDelete = Permission._(r'album.delete');
  static const albumPeriodStatistics = Permission._(r'album.statistics');
  static const albumPeriodShare = Permission._(r'album.share');
  static const albumPeriodDownload = Permission._(r'album.download');
  static const albumAssetPeriodCreate = Permission._(r'albumAsset.create');
  static const albumAssetPeriodDelete = Permission._(r'albumAsset.delete');
  static const albumUserPeriodCreate = Permission._(r'albumUser.create');
  static const albumUserPeriodUpdate = Permission._(r'albumUser.update');
  static const albumUserPeriodDelete = Permission._(r'albumUser.delete');
  static const authPeriodChangePassword = Permission._(r'auth.changePassword');
  static const authDevicePeriodDelete = Permission._(r'authDevice.delete');
  static const archivePeriodRead = Permission._(r'archive.read');
  static const duplicatePeriodRead = Permission._(r'duplicate.read');
  static const duplicatePeriodDelete = Permission._(r'duplicate.delete');
  static const facePeriodCreate = Permission._(r'face.create');
  static const facePeriodRead = Permission._(r'face.read');
  static const facePeriodUpdate = Permission._(r'face.update');
  static const facePeriodDelete = Permission._(r'face.delete');
  static const jobPeriodCreate = Permission._(r'job.create');
  static const jobPeriodRead = Permission._(r'job.read');
  static const libraryPeriodCreate = Permission._(r'library.create');
  static const libraryPeriodRead = Permission._(r'library.read');
  static const libraryPeriodUpdate = Permission._(r'library.update');
  static const libraryPeriodDelete = Permission._(r'library.delete');
  static const libraryPeriodStatistics = Permission._(r'library.statistics');
  static const timelinePeriodRead = Permission._(r'timeline.read');
  static const timelinePeriodDownload = Permission._(r'timeline.download');
  static const maintenance = Permission._(r'maintenance');
  static const memoryPeriodCreate = Permission._(r'memory.create');
  static const memoryPeriodRead = Permission._(r'memory.read');
  static const memoryPeriodUpdate = Permission._(r'memory.update');
  static const memoryPeriodDelete = Permission._(r'memory.delete');
  static const memoryPeriodStatistics = Permission._(r'memory.statistics');
  static const memoryAssetPeriodCreate = Permission._(r'memoryAsset.create');
  static const memoryAssetPeriodDelete = Permission._(r'memoryAsset.delete');
  static const notificationPeriodCreate = Permission._(r'notification.create');
  static const notificationPeriodRead = Permission._(r'notification.read');
  static const notificationPeriodUpdate = Permission._(r'notification.update');
  static const notificationPeriodDelete = Permission._(r'notification.delete');
  static const partnerPeriodCreate = Permission._(r'partner.create');
  static const partnerPeriodRead = Permission._(r'partner.read');
  static const partnerPeriodUpdate = Permission._(r'partner.update');
  static const partnerPeriodDelete = Permission._(r'partner.delete');
  static const personPeriodCreate = Permission._(r'person.create');
  static const personPeriodRead = Permission._(r'person.read');
  static const personPeriodUpdate = Permission._(r'person.update');
  static const personPeriodDelete = Permission._(r'person.delete');
  static const personPeriodStatistics = Permission._(r'person.statistics');
  static const personPeriodMerge = Permission._(r'person.merge');
  static const personPeriodReassign = Permission._(r'person.reassign');
  static const pinCodePeriodCreate = Permission._(r'pinCode.create');
  static const pinCodePeriodUpdate = Permission._(r'pinCode.update');
  static const pinCodePeriodDelete = Permission._(r'pinCode.delete');
  static const pluginPeriodCreate = Permission._(r'plugin.create');
  static const pluginPeriodRead = Permission._(r'plugin.read');
  static const pluginPeriodUpdate = Permission._(r'plugin.update');
  static const pluginPeriodDelete = Permission._(r'plugin.delete');
  static const serverPeriodAbout = Permission._(r'server.about');
  static const serverPeriodApkLinks = Permission._(r'server.apkLinks');
  static const serverPeriodStorage = Permission._(r'server.storage');
  static const serverPeriodStatistics = Permission._(r'server.statistics');
  static const serverPeriodVersionCheck = Permission._(r'server.versionCheck');
  static const serverLicensePeriodRead = Permission._(r'serverLicense.read');
  static const serverLicensePeriodUpdate = Permission._(r'serverLicense.update');
  static const serverLicensePeriodDelete = Permission._(r'serverLicense.delete');
  static const sessionPeriodCreate = Permission._(r'session.create');
  static const sessionPeriodRead = Permission._(r'session.read');
  static const sessionPeriodUpdate = Permission._(r'session.update');
  static const sessionPeriodDelete = Permission._(r'session.delete');
  static const sessionPeriodLock = Permission._(r'session.lock');
  static const sharedLinkPeriodCreate = Permission._(r'sharedLink.create');
  static const sharedLinkPeriodRead = Permission._(r'sharedLink.read');
  static const sharedLinkPeriodUpdate = Permission._(r'sharedLink.update');
  static const sharedLinkPeriodDelete = Permission._(r'sharedLink.delete');
  static const stackPeriodCreate = Permission._(r'stack.create');
  static const stackPeriodRead = Permission._(r'stack.read');
  static const stackPeriodUpdate = Permission._(r'stack.update');
  static const stackPeriodDelete = Permission._(r'stack.delete');
  static const syncPeriodStream = Permission._(r'sync.stream');
  static const syncCheckpointPeriodRead = Permission._(r'syncCheckpoint.read');
  static const syncCheckpointPeriodUpdate = Permission._(r'syncCheckpoint.update');
  static const syncCheckpointPeriodDelete = Permission._(r'syncCheckpoint.delete');
  static const systemConfigPeriodRead = Permission._(r'systemConfig.read');
  static const systemConfigPeriodUpdate = Permission._(r'systemConfig.update');
  static const systemMetadataPeriodRead = Permission._(r'systemMetadata.read');
  static const systemMetadataPeriodUpdate = Permission._(r'systemMetadata.update');
  static const tagPeriodCreate = Permission._(r'tag.create');
  static const tagPeriodRead = Permission._(r'tag.read');
  static const tagPeriodUpdate = Permission._(r'tag.update');
  static const tagPeriodDelete = Permission._(r'tag.delete');
  static const tagPeriodAsset = Permission._(r'tag.asset');
  static const userPeriodRead = Permission._(r'user.read');
  static const userPeriodUpdate = Permission._(r'user.update');
  static const userLicensePeriodCreate = Permission._(r'userLicense.create');
  static const userLicensePeriodRead = Permission._(r'userLicense.read');
  static const userLicensePeriodUpdate = Permission._(r'userLicense.update');
  static const userLicensePeriodDelete = Permission._(r'userLicense.delete');
  static const userOnboardingPeriodRead = Permission._(r'userOnboarding.read');
  static const userOnboardingPeriodUpdate = Permission._(r'userOnboarding.update');
  static const userOnboardingPeriodDelete = Permission._(r'userOnboarding.delete');
  static const userPreferencePeriodRead = Permission._(r'userPreference.read');
  static const userPreferencePeriodUpdate = Permission._(r'userPreference.update');
  static const userProfileImagePeriodCreate = Permission._(r'userProfileImage.create');
  static const userProfileImagePeriodRead = Permission._(r'userProfileImage.read');
  static const userProfileImagePeriodUpdate = Permission._(r'userProfileImage.update');
  static const userProfileImagePeriodDelete = Permission._(r'userProfileImage.delete');
  static const queuePeriodRead = Permission._(r'queue.read');
  static const queuePeriodUpdate = Permission._(r'queue.update');
  static const queueJobPeriodCreate = Permission._(r'queueJob.create');
  static const queueJobPeriodRead = Permission._(r'queueJob.read');
  static const queueJobPeriodUpdate = Permission._(r'queueJob.update');
  static const queueJobPeriodDelete = Permission._(r'queueJob.delete');
  static const workflowPeriodCreate = Permission._(r'workflow.create');
  static const workflowPeriodRead = Permission._(r'workflow.read');
  static const workflowPeriodUpdate = Permission._(r'workflow.update');
  static const workflowPeriodDelete = Permission._(r'workflow.delete');
  static const adminUserPeriodCreate = Permission._(r'adminUser.create');
  static const adminUserPeriodRead = Permission._(r'adminUser.read');
  static const adminUserPeriodUpdate = Permission._(r'adminUser.update');
  static const adminUserPeriodDelete = Permission._(r'adminUser.delete');
  static const adminSessionPeriodRead = Permission._(r'adminSession.read');
  static const adminAuthPeriodUnlinkAll = Permission._(r'adminAuth.unlinkAll');

  /// List of all possible values in this [enum][Permission].
  static const values = <Permission>[
    all,
    activityPeriodCreate,
    activityPeriodRead,
    activityPeriodUpdate,
    activityPeriodDelete,
    activityPeriodStatistics,
    apiKeyPeriodCreate,
    apiKeyPeriodRead,
    apiKeyPeriodUpdate,
    apiKeyPeriodDelete,
    assetPeriodRead,
    assetPeriodUpdate,
    assetPeriodDelete,
    assetPeriodStatistics,
    assetPeriodShare,
    assetPeriodView,
    assetPeriodDownload,
    assetPeriodUpload,
    assetPeriodReplace,
    assetPeriodCopy,
    assetPeriodDerive,
    assetPeriodEditPeriodGet,
    assetPeriodEditPeriodCreate,
    assetPeriodEditPeriodDelete,
    albumPeriodCreate,
    albumPeriodRead,
    albumPeriodUpdate,
    albumPeriodDelete,
    albumPeriodStatistics,
    albumPeriodShare,
    albumPeriodDownload,
    albumAssetPeriodCreate,
    albumAssetPeriodDelete,
    albumUserPeriodCreate,
    albumUserPeriodUpdate,
    albumUserPeriodDelete,
    authPeriodChangePassword,
    authDevicePeriodDelete,
    archivePeriodRead,
    duplicatePeriodRead,
    duplicatePeriodDelete,
    facePeriodCreate,
    facePeriodRead,
    facePeriodUpdate,
    facePeriodDelete,
    jobPeriodCreate,
    jobPeriodRead,
    libraryPeriodCreate,
    libraryPeriodRead,
    libraryPeriodUpdate,
    libraryPeriodDelete,
    libraryPeriodStatistics,
    timelinePeriodRead,
    timelinePeriodDownload,
    maintenance,
    memoryPeriodCreate,
    memoryPeriodRead,
    memoryPeriodUpdate,
    memoryPeriodDelete,
    memoryPeriodStatistics,
    memoryAssetPeriodCreate,
    memoryAssetPeriodDelete,
    notificationPeriodCreate,
    notificationPeriodRead,
    notificationPeriodUpdate,
    notificationPeriodDelete,
    partnerPeriodCreate,
    partnerPeriodRead,
    partnerPeriodUpdate,
    partnerPeriodDelete,
    personPeriodCreate,
    personPeriodRead,
    personPeriodUpdate,
    personPeriodDelete,
    personPeriodStatistics,
    personPeriodMerge,
    personPeriodReassign,
    pinCodePeriodCreate,
    pinCodePeriodUpdate,
    pinCodePeriodDelete,
    pluginPeriodCreate,
    pluginPeriodRead,
    pluginPeriodUpdate,
    pluginPeriodDelete,
    serverPeriodAbout,
    serverPeriodApkLinks,
    serverPeriodStorage,
    serverPeriodStatistics,
    serverPeriodVersionCheck,
    serverLicensePeriodRead,
    serverLicensePeriodUpdate,
    serverLicensePeriodDelete,
    sessionPeriodCreate,
    sessionPeriodRead,
    sessionPeriodUpdate,
    sessionPeriodDelete,
    sessionPeriodLock,
    sharedLinkPeriodCreate,
    sharedLinkPeriodRead,
    sharedLinkPeriodUpdate,
    sharedLinkPeriodDelete,
    stackPeriodCreate,
    stackPeriodRead,
    stackPeriodUpdate,
    stackPeriodDelete,
    syncPeriodStream,
    syncCheckpointPeriodRead,
    syncCheckpointPeriodUpdate,
    syncCheckpointPeriodDelete,
    systemConfigPeriodRead,
    systemConfigPeriodUpdate,
    systemMetadataPeriodRead,
    systemMetadataPeriodUpdate,
    tagPeriodCreate,
    tagPeriodRead,
    tagPeriodUpdate,
    tagPeriodDelete,
    tagPeriodAsset,
    userPeriodRead,
    userPeriodUpdate,
    userLicensePeriodCreate,
    userLicensePeriodRead,
    userLicensePeriodUpdate,
    userLicensePeriodDelete,
    userOnboardingPeriodRead,
    userOnboardingPeriodUpdate,
    userOnboardingPeriodDelete,
    userPreferencePeriodRead,
    userPreferencePeriodUpdate,
    userProfileImagePeriodCreate,
    userProfileImagePeriodRead,
    userProfileImagePeriodUpdate,
    userProfileImagePeriodDelete,
    queuePeriodRead,
    queuePeriodUpdate,
    queueJobPeriodCreate,
    queueJobPeriodRead,
    queueJobPeriodUpdate,
    queueJobPeriodDelete,
    workflowPeriodCreate,
    workflowPeriodRead,
    workflowPeriodUpdate,
    workflowPeriodDelete,
    adminUserPeriodCreate,
    adminUserPeriodRead,
    adminUserPeriodUpdate,
    adminUserPeriodDelete,
    adminSessionPeriodRead,
    adminAuthPeriodUnlinkAll,
  ];

  static Permission? fromJson(dynamic value) => PermissionTypeTransformer().decode(value);

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

  String encode(Permission data) => data.value;

  /// Decodes a [dynamic value][data] to a Permission.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  Permission? decode(dynamic data, {bool allowNull = true}) {
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
        case r'asset.replace': return Permission.assetPeriodReplace;
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
        case r'duplicate.read': return Permission.duplicatePeriodRead;
        case r'duplicate.delete': return Permission.duplicatePeriodDelete;
        case r'face.create': return Permission.facePeriodCreate;
        case r'face.read': return Permission.facePeriodRead;
        case r'face.update': return Permission.facePeriodUpdate;
        case r'face.delete': return Permission.facePeriodDelete;
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

  /// Singleton [PermissionTypeTransformer] instance.
  static PermissionTypeTransformer? _instance;
}

