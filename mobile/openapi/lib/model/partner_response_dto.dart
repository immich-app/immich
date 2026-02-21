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
    required this.email,
    required this.id,
    this.inTimeline,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  PartnerResponseDtoAvatarColorEnum avatarColor;

  /// User email
  String email;

  /// User ID
  String id;

  /// Show in timeline
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inTimeline;

  /// User name
  String name;

  /// Profile change date
  DateTime profileChangedAt;

  /// Profile image path
  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartnerResponseDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.id == id &&
    other.inTimeline == inTimeline &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (inTimeline == null ? 0 : inTimeline!.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'PartnerResponseDto[avatarColor=$avatarColor, email=$email, id=$id, inTimeline=$inTimeline, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
    if (this.inTimeline != null) {
      json[r'inTimeline'] = this.inTimeline;
    } else {
    //  json[r'inTimeline'] = null;
    }
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.profileChangedAt.millisecondsSinceEpoch
        : this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [PartnerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartnerResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PartnerResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartnerResponseDto(
        avatarColor: PartnerResponseDtoAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        inTimeline: mapValueOfType<bool>(json, r'inTimeline'),
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
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
    'email',
    'id',
    'name',
    'profileChangedAt',
    'profileImagePath',
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

  static List<PartnerResponseDtoAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
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


