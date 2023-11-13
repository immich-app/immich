//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

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
    required this.externalPath,
    required this.id,
    this.inTimeline,
    required this.isAdmin,
    this.memoriesEnabled,
    required this.name,
    required this.oauthId,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.storageLabel,
    required this.updatedAt,
  });

  PartnerResponseDtoAvatarColorEnum avatarColor;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String? externalPath;

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

  bool shouldChangePassword;

  String? storageLabel;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartnerResponseDto &&
     other.avatarColor == avatarColor &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.email == email &&
     other.externalPath == externalPath &&
     other.id == id &&
     other.inTimeline == inTimeline &&
     other.isAdmin == isAdmin &&
     other.memoriesEnabled == memoriesEnabled &&
     other.name == name &&
     other.oauthId == oauthId &&
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.storageLabel == storageLabel &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (externalPath == null ? 0 : externalPath!.hashCode) +
    (id.hashCode) +
    (inTimeline == null ? 0 : inTimeline!.hashCode) +
    (isAdmin.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (name.hashCode) +
    (oauthId.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'PartnerResponseDto[avatarColor=$avatarColor, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, externalPath=$externalPath, id=$id, inTimeline=$inTimeline, isAdmin=$isAdmin, memoriesEnabled=$memoriesEnabled, name=$name, oauthId=$oauthId, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel, updatedAt=$updatedAt]';

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
    if (this.externalPath != null) {
      json[r'externalPath'] = this.externalPath;
    } else {
    //  json[r'externalPath'] = null;
    }
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
      json[r'shouldChangePassword'] = this.shouldChangePassword;
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
        avatarColor: PartnerResponseDtoAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        email: mapValueOfType<String>(json, r'email')!,
        externalPath: mapValueOfType<String>(json, r'externalPath'),
        id: mapValueOfType<String>(json, r'id')!,
        inTimeline: mapValueOfType<bool>(json, r'inTimeline'),
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
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
    'externalPath',
    'id',
    'isAdmin',
    'name',
    'oauthId',
    'profileImagePath',
    'shouldChangePassword',
    'storageLabel',
    'updatedAt',
  };
}


class PartnerResponseDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const PartnerResponseDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = PartnerResponseDtoAvatarColorEnum._(r'primary');
  static const pink = PartnerResponseDtoAvatarColorEnum._(r'pink');
  static const red = PartnerResponseDtoAvatarColorEnum._(r'red');
  static const yellow = PartnerResponseDtoAvatarColorEnum._(r'yellow');
  static const blue = PartnerResponseDtoAvatarColorEnum._(r'blue');
  static const green = PartnerResponseDtoAvatarColorEnum._(r'green');
  static const purple = PartnerResponseDtoAvatarColorEnum._(r'purple');
  static const orange = PartnerResponseDtoAvatarColorEnum._(r'orange');
  static const gray = PartnerResponseDtoAvatarColorEnum._(r'gray');
  static const amber = PartnerResponseDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][PartnerResponseDtoAvatarColorEnum].
  static const values = <PartnerResponseDtoAvatarColorEnum>[
    primary,
    pink,
    red,
    yellow,
    blue,
    green,
    purple,
    orange,
    gray,
    amber,
  ];

  static PartnerResponseDtoAvatarColorEnum? fromJson(dynamic value) => PartnerResponseDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<PartnerResponseDtoAvatarColorEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartnerResponseDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartnerResponseDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PartnerResponseDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [PartnerResponseDtoAvatarColorEnum].
class PartnerResponseDtoAvatarColorEnumTypeTransformer {
  factory PartnerResponseDtoAvatarColorEnumTypeTransformer() => _instance ??= const PartnerResponseDtoAvatarColorEnumTypeTransformer._();

  const PartnerResponseDtoAvatarColorEnumTypeTransformer._();

  String encode(PartnerResponseDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a PartnerResponseDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PartnerResponseDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return PartnerResponseDtoAvatarColorEnum.primary;
        case r'pink': return PartnerResponseDtoAvatarColorEnum.pink;
        case r'red': return PartnerResponseDtoAvatarColorEnum.red;
        case r'yellow': return PartnerResponseDtoAvatarColorEnum.yellow;
        case r'blue': return PartnerResponseDtoAvatarColorEnum.blue;
        case r'green': return PartnerResponseDtoAvatarColorEnum.green;
        case r'purple': return PartnerResponseDtoAvatarColorEnum.purple;
        case r'orange': return PartnerResponseDtoAvatarColorEnum.orange;
        case r'gray': return PartnerResponseDtoAvatarColorEnum.gray;
        case r'amber': return PartnerResponseDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PartnerResponseDtoAvatarColorEnumTypeTransformer] instance.
  static PartnerResponseDtoAvatarColorEnumTypeTransformer? _instance;
}


