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
  static const assetPeriodShare = Permission._(r'asset.share');
  static const assetPeriodView = Permission._(r'asset.view');
  static const assetPeriodDownload = Permission._(r'asset.download');
  static const assetPeriodUpload = Permission._(r'asset.upload');
  static const albumPeriodCreate = Permission._(r'album.create');
  static const albumPeriodRead = Permission._(r'album.read');
  static const albumPeriodUpdate = Permission._(r'album.update');
  static const albumPeriodDelete = Permission._(r'album.delete');
  static const albumPeriodStatistics = Permission._(r'album.statistics');
  static const albumPeriodAddAsset = Permission._(r'album.addAsset');
  static const albumPeriodRemoveAsset = Permission._(r'album.removeAsset');
  static const albumPeriodShare = Permission._(r'album.share');
  static const albumPeriodDownload = Permission._(r'album.download');
  static const authDevicePeriodDelete = Permission._(r'authDevice.delete');
  static const archivePeriodRead = Permission._(r'archive.read');
  static const facePeriodCreate = Permission._(r'face.create');
  static const facePeriodRead = Permission._(r'face.read');
  static const facePeriodUpdate = Permission._(r'face.update');
  static const facePeriodDelete = Permission._(r'face.delete');
  static const libraryPeriodCreate = Permission._(r'library.create');
  static const libraryPeriodRead = Permission._(r'library.read');
  static const libraryPeriodUpdate = Permission._(r'library.update');
  static const libraryPeriodDelete = Permission._(r'library.delete');
  static const libraryPeriodStatistics = Permission._(r'library.statistics');
  static const timelinePeriodRead = Permission._(r'timeline.read');
  static const timelinePeriodDownload = Permission._(r'timeline.download');
  static const memoryPeriodCreate = Permission._(r'memory.create');
  static const memoryPeriodRead = Permission._(r'memory.read');
  static const memoryPeriodUpdate = Permission._(r'memory.update');
  static const memoryPeriodDelete = Permission._(r'memory.delete');
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
  static const sessionPeriodRead = Permission._(r'session.read');
  static const sessionPeriodUpdate = Permission._(r'session.update');
  static const sessionPeriodDelete = Permission._(r'session.delete');
  static const sharedLinkPeriodCreate = Permission._(r'sharedLink.create');
  static const sharedLinkPeriodRead = Permission._(r'sharedLink.read');
  static const sharedLinkPeriodUpdate = Permission._(r'sharedLink.update');
  static const sharedLinkPeriodDelete = Permission._(r'sharedLink.delete');
  static const stackPeriodCreate = Permission._(r'stack.create');
  static const stackPeriodRead = Permission._(r'stack.read');
  static const stackPeriodUpdate = Permission._(r'stack.update');
  static const stackPeriodDelete = Permission._(r'stack.delete');
  static const systemConfigPeriodRead = Permission._(r'systemConfig.read');
  static const systemConfigPeriodUpdate = Permission._(r'systemConfig.update');
  static const systemMetadataPeriodRead = Permission._(r'systemMetadata.read');
  static const systemMetadataPeriodUpdate = Permission._(r'systemMetadata.update');
  static const tagPeriodCreate = Permission._(r'tag.create');
  static const tagPeriodRead = Permission._(r'tag.read');
  static const tagPeriodUpdate = Permission._(r'tag.update');
  static const tagPeriodDelete = Permission._(r'tag.delete');
  static const tagPeriodAsset = Permission._(r'tag.asset');
  static const adminPeriodUserPeriodCreate = Permission._(r'admin.user.create');
  static const adminPeriodUserPeriodRead = Permission._(r'admin.user.read');
  static const adminPeriodUserPeriodUpdate = Permission._(r'admin.user.update');
  static const adminPeriodUserPeriodDelete = Permission._(r'admin.user.delete');

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
    assetPeriodShare,
    assetPeriodView,
    assetPeriodDownload,
    assetPeriodUpload,
    albumPeriodCreate,
    albumPeriodRead,
    albumPeriodUpdate,
    albumPeriodDelete,
    albumPeriodStatistics,
    albumPeriodAddAsset,
    albumPeriodRemoveAsset,
    albumPeriodShare,
    albumPeriodDownload,
    authDevicePeriodDelete,
    archivePeriodRead,
    facePeriodCreate,
    facePeriodRead,
    facePeriodUpdate,
    facePeriodDelete,
    libraryPeriodCreate,
    libraryPeriodRead,
    libraryPeriodUpdate,
    libraryPeriodDelete,
    libraryPeriodStatistics,
    timelinePeriodRead,
    timelinePeriodDownload,
    memoryPeriodCreate,
    memoryPeriodRead,
    memoryPeriodUpdate,
    memoryPeriodDelete,
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
    sessionPeriodRead,
    sessionPeriodUpdate,
    sessionPeriodDelete,
    sharedLinkPeriodCreate,
    sharedLinkPeriodRead,
    sharedLinkPeriodUpdate,
    sharedLinkPeriodDelete,
    stackPeriodCreate,
    stackPeriodRead,
    stackPeriodUpdate,
    stackPeriodDelete,
    systemConfigPeriodRead,
    systemConfigPeriodUpdate,
    systemMetadataPeriodRead,
    systemMetadataPeriodUpdate,
    tagPeriodCreate,
    tagPeriodRead,
    tagPeriodUpdate,
    tagPeriodDelete,
    tagPeriodAsset,
    adminPeriodUserPeriodCreate,
    adminPeriodUserPeriodRead,
    adminPeriodUserPeriodUpdate,
    adminPeriodUserPeriodDelete,
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
        case r'asset.share': return Permission.assetPeriodShare;
        case r'asset.view': return Permission.assetPeriodView;
        case r'asset.download': return Permission.assetPeriodDownload;
        case r'asset.upload': return Permission.assetPeriodUpload;
        case r'album.create': return Permission.albumPeriodCreate;
        case r'album.read': return Permission.albumPeriodRead;
        case r'album.update': return Permission.albumPeriodUpdate;
        case r'album.delete': return Permission.albumPeriodDelete;
        case r'album.statistics': return Permission.albumPeriodStatistics;
        case r'album.addAsset': return Permission.albumPeriodAddAsset;
        case r'album.removeAsset': return Permission.albumPeriodRemoveAsset;
        case r'album.share': return Permission.albumPeriodShare;
        case r'album.download': return Permission.albumPeriodDownload;
        case r'authDevice.delete': return Permission.authDevicePeriodDelete;
        case r'archive.read': return Permission.archivePeriodRead;
        case r'face.create': return Permission.facePeriodCreate;
        case r'face.read': return Permission.facePeriodRead;
        case r'face.update': return Permission.facePeriodUpdate;
        case r'face.delete': return Permission.facePeriodDelete;
        case r'library.create': return Permission.libraryPeriodCreate;
        case r'library.read': return Permission.libraryPeriodRead;
        case r'library.update': return Permission.libraryPeriodUpdate;
        case r'library.delete': return Permission.libraryPeriodDelete;
        case r'library.statistics': return Permission.libraryPeriodStatistics;
        case r'timeline.read': return Permission.timelinePeriodRead;
        case r'timeline.download': return Permission.timelinePeriodDownload;
        case r'memory.create': return Permission.memoryPeriodCreate;
        case r'memory.read': return Permission.memoryPeriodRead;
        case r'memory.update': return Permission.memoryPeriodUpdate;
        case r'memory.delete': return Permission.memoryPeriodDelete;
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
        case r'session.read': return Permission.sessionPeriodRead;
        case r'session.update': return Permission.sessionPeriodUpdate;
        case r'session.delete': return Permission.sessionPeriodDelete;
        case r'sharedLink.create': return Permission.sharedLinkPeriodCreate;
        case r'sharedLink.read': return Permission.sharedLinkPeriodRead;
        case r'sharedLink.update': return Permission.sharedLinkPeriodUpdate;
        case r'sharedLink.delete': return Permission.sharedLinkPeriodDelete;
        case r'stack.create': return Permission.stackPeriodCreate;
        case r'stack.read': return Permission.stackPeriodRead;
        case r'stack.update': return Permission.stackPeriodUpdate;
        case r'stack.delete': return Permission.stackPeriodDelete;
        case r'systemConfig.read': return Permission.systemConfigPeriodRead;
        case r'systemConfig.update': return Permission.systemConfigPeriodUpdate;
        case r'systemMetadata.read': return Permission.systemMetadataPeriodRead;
        case r'systemMetadata.update': return Permission.systemMetadataPeriodUpdate;
        case r'tag.create': return Permission.tagPeriodCreate;
        case r'tag.read': return Permission.tagPeriodRead;
        case r'tag.update': return Permission.tagPeriodUpdate;
        case r'tag.delete': return Permission.tagPeriodDelete;
        case r'tag.asset': return Permission.tagPeriodAsset;
        case r'admin.user.create': return Permission.adminPeriodUserPeriodCreate;
        case r'admin.user.read': return Permission.adminPeriodUserPeriodRead;
        case r'admin.user.update': return Permission.adminPeriodUserPeriodUpdate;
        case r'admin.user.delete': return Permission.adminPeriodUserPeriodDelete;
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

