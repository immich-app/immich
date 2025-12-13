//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAuthUserV1 {
  /// Returns a new [SyncAuthUserV1] instance.
  SyncAuthUserV1({
    required this.avatarColor,
    required this.deletedAt,
    required this.email,
    required this.hasProfileImage,
    required this.id,
    required this.isAdmin,
    required this.name,
    required this.oauthId,
    required this.pinCode,
    required this.profileChangedAt,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.storageLabel,
  });

  UserAvatarColor? avatarColor;

  DateTime? deletedAt;

  String email;

  bool hasProfileImage;

  String id;

  bool isAdmin;

  String name;

  String oauthId;

  String? pinCode;

  DateTime profileChangedAt;

  int? quotaSizeInBytes;

  int quotaUsageInBytes;

  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAuthUserV1 &&
    other.avatarColor == avatarColor &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.hasProfileImage == hasProfileImage &&
    other.id == id &&
    other.isAdmin == isAdmin &&
    other.name == name &&
    other.oauthId == oauthId &&
    other.pinCode == pinCode &&
    other.profileChangedAt == profileChangedAt &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.quotaUsageInBytes == quotaUsageInBytes &&
    other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (hasProfileImage.hashCode) +
    (id.hashCode) +
    (isAdmin.hashCode) +
    (name.hashCode) +
    (oauthId.hashCode) +
    (pinCode == null ? 0 : pinCode!.hashCode) +
    (profileChangedAt.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (quotaUsageInBytes.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'SyncAuthUserV1[avatarColor=$avatarColor, deletedAt=$deletedAt, email=$email, hasProfileImage=$hasProfileImage, id=$id, isAdmin=$isAdmin, name=$name, oauthId=$oauthId, pinCode=$pinCode, profileChangedAt=$profileChangedAt, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'hasProfileImage'] = this.hasProfileImage;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
      json[r'name'] = this.name;
      json[r'oauthId'] = this.oauthId;
    if (this.pinCode != null) {
      json[r'pinCode'] = this.pinCode;
    } else {
    //  json[r'pinCode'] = null;
    }
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
    }
      json[r'quotaUsageInBytes'] = this.quotaUsageInBytes;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
    return json;
  }

  /// Returns a new [SyncAuthUserV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAuthUserV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAuthUserV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAuthUserV1(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor']),
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        email: mapValueOfType<String>(json, r'email')!,
        hasProfileImage: mapValueOfType<bool>(json, r'hasProfileImage')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        pinCode: mapValueOfType<String>(json, r'pinCode'),
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        quotaUsageInBytes: mapValueOfType<int>(json, r'quotaUsageInBytes')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
      );
    }
    return null;
  }

  static List<SyncAuthUserV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAuthUserV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAuthUserV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAuthUserV1> mapFromJson(dynamic json) {
    final map = <String, SyncAuthUserV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAuthUserV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAuthUserV1-objects as value to a dart map
  static Map<String, List<SyncAuthUserV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAuthUserV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAuthUserV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'deletedAt',
    'email',
    'hasProfileImage',
    'id',
    'isAdmin',
    'name',
    'oauthId',
    'pinCode',
    'profileChangedAt',
    'quotaSizeInBytes',
    'quotaUsageInBytes',
    'storageLabel',
  };
}

