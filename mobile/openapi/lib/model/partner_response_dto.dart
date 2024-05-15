//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PartnerResponseDto {
  /// Returns a new [PartnerResponseDto] instance.
  PartnerResponseDto({
    required this.avatarColor,
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.id,
    this.inTimeline,
    required this.isAdmin,
    this.memoriesEnabled,
    required this.name,
    required this.oauthId,
    required this.profileImagePath,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.shouldChangePassword,
    required this.status,
    required this.storageLabel,
    required this.updatedAt,
  });

  UserAvatarColor avatarColor;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inTimeline;

  bool isAdmin;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

  String name;

  String oauthId;

  String profileImagePath;

  int? quotaSizeInBytes;

  int? quotaUsageInBytes;

  bool shouldChangePassword;

  UserStatus status;

  String? storageLabel;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartnerResponseDto &&
    other.avatarColor == avatarColor &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.id == id &&
    other.inTimeline == inTimeline &&
    other.isAdmin == isAdmin &&
    other.memoriesEnabled == memoriesEnabled &&
    other.name == name &&
    other.oauthId == oauthId &&
    other.profileImagePath == profileImagePath &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.quotaUsageInBytes == quotaUsageInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.status == status &&
    other.storageLabel == storageLabel &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (inTimeline == null ? 0 : inTimeline!.hashCode) +
    (isAdmin.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (name.hashCode) +
    (oauthId.hashCode) +
    (profileImagePath.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (quotaUsageInBytes == null ? 0 : quotaUsageInBytes!.hashCode) +
    (shouldChangePassword.hashCode) +
    (status.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'PartnerResponseDto[avatarColor=$avatarColor, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, id=$id, inTimeline=$inTimeline, isAdmin=$isAdmin, memoriesEnabled=$memoriesEnabled, name=$name, oauthId=$oauthId, profileImagePath=$profileImagePath, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, shouldChangePassword=$shouldChangePassword, status=$status, storageLabel=$storageLabel, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'id'] = this.id;
    if (this.inTimeline != null) {
      json[r'inTimeline'] = this.inTimeline;
    } else {
    //  json[r'inTimeline'] = null;
    }
      json[r'isAdmin'] = this.isAdmin;
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
      json[r'name'] = this.name;
      json[r'oauthId'] = this.oauthId;
      json[r'profileImagePath'] = this.profileImagePath;
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
    }
    if (this.quotaUsageInBytes != null) {
      json[r'quotaUsageInBytes'] = this.quotaUsageInBytes;
    } else {
    //  json[r'quotaUsageInBytes'] = null;
    }
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'status'] = this.status;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [PartnerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartnerResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartnerResponseDto(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor'])!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        inTimeline: mapValueOfType<bool>(json, r'inTimeline'),
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        quotaUsageInBytes: mapValueOfType<int>(json, r'quotaUsageInBytes'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        status: UserStatus.fromJson(json[r'status'])!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<PartnerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartnerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartnerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PartnerResponseDto> mapFromJson(dynamic json) {
    final map = <String, PartnerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PartnerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PartnerResponseDto-objects as value to a dart map
  static Map<String, List<PartnerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PartnerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PartnerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'createdAt',
    'deletedAt',
    'email',
    'id',
    'isAdmin',
    'name',
    'oauthId',
    'profileImagePath',
    'quotaSizeInBytes',
    'quotaUsageInBytes',
    'shouldChangePassword',
    'status',
    'storageLabel',
    'updatedAt',
  };
}

