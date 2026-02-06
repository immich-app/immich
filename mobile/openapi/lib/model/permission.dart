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
class Permission {
  /// Instantiate a new enum with the provided [value].
  const Permission._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = Permission._(r'all');
  static const apiKeyPeriodCreate = Permission._(r'apiKey.create');
  static const apiKeyPeriodRead = Permission._(r'apiKey.read');
  static const apiKeyPeriodUpdate = Permission._(r'apiKey.update');
  static const apiKeyPeriodDelete = Permission._(r'apiKey.delete');
  static const authPeriodChangePassword = Permission._(r'auth.changePassword');
  static const authDevicePeriodDelete = Permission._(r'authDevice.delete');
  static const sessionPeriodCreate = Permission._(r'session.create');
  static const sessionPeriodRead = Permission._(r'session.read');
  static const sessionPeriodUpdate = Permission._(r'session.update');
  static const sessionPeriodDelete = Permission._(r'session.delete');
  static const systemMetadataPeriodRead = Permission._(r'systemMetadata.read');
  static const systemMetadataPeriodUpdate = Permission._(r'systemMetadata.update');
  static const userPeriodRead = Permission._(r'user.read');
  static const userPeriodUpdate = Permission._(r'user.update');
  static const serverPeriodAbout = Permission._(r'server.about');
  static const adminUserPeriodCreate = Permission._(r'adminUser.create');
  static const adminUserPeriodRead = Permission._(r'adminUser.read');
  static const adminUserPeriodUpdate = Permission._(r'adminUser.update');
  static const adminUserPeriodDelete = Permission._(r'adminUser.delete');

  /// List of all possible values in this [enum][Permission].
  static const values = <Permission>[
    all,
    apiKeyPeriodCreate,
    apiKeyPeriodRead,
    apiKeyPeriodUpdate,
    apiKeyPeriodDelete,
    authPeriodChangePassword,
    authDevicePeriodDelete,
    sessionPeriodCreate,
    sessionPeriodRead,
    sessionPeriodUpdate,
    sessionPeriodDelete,
    systemMetadataPeriodRead,
    systemMetadataPeriodUpdate,
    userPeriodRead,
    userPeriodUpdate,
    serverPeriodAbout,
    adminUserPeriodCreate,
    adminUserPeriodRead,
    adminUserPeriodUpdate,
    adminUserPeriodDelete,
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
        case r'apiKey.create': return Permission.apiKeyPeriodCreate;
        case r'apiKey.read': return Permission.apiKeyPeriodRead;
        case r'apiKey.update': return Permission.apiKeyPeriodUpdate;
        case r'apiKey.delete': return Permission.apiKeyPeriodDelete;
        case r'auth.changePassword': return Permission.authPeriodChangePassword;
        case r'authDevice.delete': return Permission.authDevicePeriodDelete;
        case r'session.create': return Permission.sessionPeriodCreate;
        case r'session.read': return Permission.sessionPeriodRead;
        case r'session.update': return Permission.sessionPeriodUpdate;
        case r'session.delete': return Permission.sessionPeriodDelete;
        case r'systemMetadata.read': return Permission.systemMetadataPeriodRead;
        case r'systemMetadata.update': return Permission.systemMetadataPeriodUpdate;
        case r'user.read': return Permission.userPeriodRead;
        case r'user.update': return Permission.userPeriodUpdate;
        case r'server.about': return Permission.serverPeriodAbout;
        case r'adminUser.create': return Permission.adminUserPeriodCreate;
        case r'adminUser.read': return Permission.adminUserPeriodRead;
        case r'adminUser.update': return Permission.adminUserPeriodUpdate;
        case r'adminUser.delete': return Permission.adminUserPeriodDelete;
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

