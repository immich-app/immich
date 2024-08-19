//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserEntity {
  /// Returns a new [UserEntity] instance.
  UserEntity({
    this.assets = const [],
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.id,
    required this.isAdmin,
    this.metadata = const [],
    required this.name,
    required this.oauthId,
    this.password,
    required this.profileImagePath,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.shouldChangePassword,
    required this.status,
    required this.storageLabel,
    this.tags = const [],
    required this.updatedAt,
  });

  List<AssetEntity> assets;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String id;

  bool isAdmin;

  List<String> metadata;

  String name;

  String oauthId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  String profileImagePath;

  num? quotaSizeInBytes;

  num quotaUsageInBytes;

  bool shouldChangePassword;

  UserEntityStatusEnum status;

  String? storageLabel;

  List<TagEntity> tags;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserEntity &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.id == id &&
    other.isAdmin == isAdmin &&
    _deepEquality.equals(other.metadata, metadata) &&
    other.name == name &&
    other.oauthId == oauthId &&
    other.password == password &&
    other.profileImagePath == profileImagePath &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.quotaUsageInBytes == quotaUsageInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.status == status &&
    other.storageLabel == storageLabel &&
    _deepEquality.equals(other.tags, tags) &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (isAdmin.hashCode) +
    (metadata.hashCode) +
    (name.hashCode) +
    (oauthId.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (profileImagePath.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (quotaUsageInBytes.hashCode) +
    (shouldChangePassword.hashCode) +
    (status.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (tags.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'UserEntity[assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, id=$id, isAdmin=$isAdmin, metadata=$metadata, name=$name, oauthId=$oauthId, password=$password, profileImagePath=$profileImagePath, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, shouldChangePassword=$shouldChangePassword, status=$status, storageLabel=$storageLabel, tags=$tags, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
      json[r'metadata'] = this.metadata;
      json[r'name'] = this.name;
      json[r'oauthId'] = this.oauthId;
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
      json[r'profileImagePath'] = this.profileImagePath;
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
    }
      json[r'quotaUsageInBytes'] = this.quotaUsageInBytes;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'status'] = this.status;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
      json[r'tags'] = this.tags;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [UserEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserEntity(
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        metadata: json[r'metadata'] is Iterable
            ? (json[r'metadata'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        password: mapValueOfType<String>(json, r'password'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        quotaSizeInBytes: json[r'quotaSizeInBytes'] == null
            ? null
            : num.parse('${json[r'quotaSizeInBytes']}'),
        quotaUsageInBytes: num.parse('${json[r'quotaUsageInBytes']}'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        status: UserEntityStatusEnum.fromJson(json[r'status'])!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        tags: TagEntity.listFromJson(json[r'tags']),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<UserEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserEntity> mapFromJson(dynamic json) {
    final map = <String, UserEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserEntity-objects as value to a dart map
  static Map<String, List<UserEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'createdAt',
    'deletedAt',
    'email',
    'id',
    'isAdmin',
    'metadata',
    'name',
    'oauthId',
    'profileImagePath',
    'quotaSizeInBytes',
    'quotaUsageInBytes',
    'shouldChangePassword',
    'status',
    'storageLabel',
    'tags',
    'updatedAt',
  };
}


class UserEntityStatusEnum {
  /// Instantiate a new enum with the provided [value].
  const UserEntityStatusEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const active = UserEntityStatusEnum._(r'active');
  static const removing = UserEntityStatusEnum._(r'removing');
  static const deleted = UserEntityStatusEnum._(r'deleted');

  /// List of all possible values in this [enum][UserEntityStatusEnum].
  static const values = <UserEntityStatusEnum>[
    active,
    removing,
    deleted,
  ];

  static UserEntityStatusEnum? fromJson(dynamic value) => UserEntityStatusEnumTypeTransformer().decode(value);

  static List<UserEntityStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserEntityStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserEntityStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserEntityStatusEnum] to String,
/// and [decode] dynamic data back to [UserEntityStatusEnum].
class UserEntityStatusEnumTypeTransformer {
  factory UserEntityStatusEnumTypeTransformer() => _instance ??= const UserEntityStatusEnumTypeTransformer._();

  const UserEntityStatusEnumTypeTransformer._();

  String encode(UserEntityStatusEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserEntityStatusEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserEntityStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'active': return UserEntityStatusEnum.active;
        case r'removing': return UserEntityStatusEnum.removing;
        case r'deleted': return UserEntityStatusEnum.deleted;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserEntityStatusEnumTypeTransformer] instance.
  static UserEntityStatusEnumTypeTransformer? _instance;
}


