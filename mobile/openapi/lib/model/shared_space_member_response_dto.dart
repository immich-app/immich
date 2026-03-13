//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceMemberResponseDto {
  /// Returns a new [SharedSpaceMemberResponseDto] instance.
  SharedSpaceMemberResponseDto({
    this.avatarColor,
    this.contributionCount,
    required this.email,
    required this.joinedAt,
    this.lastActiveAt,
    required this.name,
    this.profileChangedAt,
    this.profileImagePath,
    this.recentAssetId,
    required this.role,
    required this.showInTimeline,
    required this.userId,
  });

  /// Avatar color
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? avatarColor;

  /// Number of photos contributed by this member
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? contributionCount;

  /// User email
  String email;

  /// Join date
  String joinedAt;

  /// Last time this member added a photo
  String? lastActiveAt;

  /// User name
  String name;

  /// Profile change date
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? profileChangedAt;

  /// Profile image path
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? profileImagePath;

  /// Most recently added asset ID by this member
  String? recentAssetId;

  /// Member role
  SharedSpaceMemberResponseDtoRoleEnum role;

  /// Show space assets in timeline
  bool showInTimeline;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceMemberResponseDto &&
    other.avatarColor == avatarColor &&
    other.contributionCount == contributionCount &&
    other.email == email &&
    other.joinedAt == joinedAt &&
    other.lastActiveAt == lastActiveAt &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath &&
    other.recentAssetId == recentAssetId &&
    other.role == role &&
    other.showInTimeline == showInTimeline &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (contributionCount == null ? 0 : contributionCount!.hashCode) +
    (email.hashCode) +
    (joinedAt.hashCode) +
    (lastActiveAt == null ? 0 : lastActiveAt!.hashCode) +
    (name.hashCode) +
    (profileChangedAt == null ? 0 : profileChangedAt!.hashCode) +
    (profileImagePath == null ? 0 : profileImagePath!.hashCode) +
    (recentAssetId == null ? 0 : recentAssetId!.hashCode) +
    (role.hashCode) +
    (showInTimeline.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SharedSpaceMemberResponseDto[avatarColor=$avatarColor, contributionCount=$contributionCount, email=$email, joinedAt=$joinedAt, lastActiveAt=$lastActiveAt, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, recentAssetId=$recentAssetId, role=$role, showInTimeline=$showInTimeline, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.contributionCount != null) {
      json[r'contributionCount'] = this.contributionCount;
    } else {
    //  json[r'contributionCount'] = null;
    }
      json[r'email'] = this.email;
      json[r'joinedAt'] = this.joinedAt;
    if (this.lastActiveAt != null) {
      json[r'lastActiveAt'] = this.lastActiveAt;
    } else {
    //  json[r'lastActiveAt'] = null;
    }
      json[r'name'] = this.name;
    if (this.profileChangedAt != null) {
      json[r'profileChangedAt'] = this.profileChangedAt;
    } else {
    //  json[r'profileChangedAt'] = null;
    }
    if (this.profileImagePath != null) {
      json[r'profileImagePath'] = this.profileImagePath;
    } else {
    //  json[r'profileImagePath'] = null;
    }
    if (this.recentAssetId != null) {
      json[r'recentAssetId'] = this.recentAssetId;
    } else {
    //  json[r'recentAssetId'] = null;
    }
      json[r'role'] = this.role;
      json[r'showInTimeline'] = this.showInTimeline;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SharedSpaceMemberResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceMemberResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceMemberResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceMemberResponseDto(
        avatarColor: mapValueOfType<String>(json, r'avatarColor'),
        contributionCount: json[r'contributionCount'] == null
            ? null
            : num.parse('${json[r'contributionCount']}'),
        email: mapValueOfType<String>(json, r'email')!,
        joinedAt: mapValueOfType<String>(json, r'joinedAt')!,
        lastActiveAt: mapValueOfType<String>(json, r'lastActiveAt'),
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapValueOfType<String>(json, r'profileChangedAt'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath'),
        recentAssetId: mapValueOfType<String>(json, r'recentAssetId'),
        role: SharedSpaceMemberResponseDtoRoleEnum.fromJson(json[r'role'])!,
        showInTimeline: mapValueOfType<bool>(json, r'showInTimeline')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SharedSpaceMemberResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceMemberResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceMemberResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceMemberResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceMemberResponseDto-objects as value to a dart map
  static Map<String, List<SharedSpaceMemberResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceMemberResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceMemberResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'joinedAt',
    'name',
    'role',
    'showInTimeline',
    'userId',
  };
}

/// Member role
class SharedSpaceMemberResponseDtoRoleEnum {
  /// Instantiate a new enum with the provided [value].
  const SharedSpaceMemberResponseDtoRoleEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const owner = SharedSpaceMemberResponseDtoRoleEnum._(r'owner');
  static const editor = SharedSpaceMemberResponseDtoRoleEnum._(r'editor');
  static const viewer = SharedSpaceMemberResponseDtoRoleEnum._(r'viewer');

  /// List of all possible values in this [enum][SharedSpaceMemberResponseDtoRoleEnum].
  static const values = <SharedSpaceMemberResponseDtoRoleEnum>[
    owner,
    editor,
    viewer,
  ];

  static SharedSpaceMemberResponseDtoRoleEnum? fromJson(dynamic value) => SharedSpaceMemberResponseDtoRoleEnumTypeTransformer().decode(value);

  static List<SharedSpaceMemberResponseDtoRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberResponseDtoRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberResponseDtoRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedSpaceMemberResponseDtoRoleEnum] to String,
/// and [decode] dynamic data back to [SharedSpaceMemberResponseDtoRoleEnum].
class SharedSpaceMemberResponseDtoRoleEnumTypeTransformer {
  factory SharedSpaceMemberResponseDtoRoleEnumTypeTransformer() => _instance ??= const SharedSpaceMemberResponseDtoRoleEnumTypeTransformer._();

  const SharedSpaceMemberResponseDtoRoleEnumTypeTransformer._();

  String encode(SharedSpaceMemberResponseDtoRoleEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedSpaceMemberResponseDtoRoleEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedSpaceMemberResponseDtoRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'owner': return SharedSpaceMemberResponseDtoRoleEnum.owner;
        case r'editor': return SharedSpaceMemberResponseDtoRoleEnum.editor;
        case r'viewer': return SharedSpaceMemberResponseDtoRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedSpaceMemberResponseDtoRoleEnumTypeTransformer] instance.
  static SharedSpaceMemberResponseDtoRoleEnumTypeTransformer? _instance;
}


