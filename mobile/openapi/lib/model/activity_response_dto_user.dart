//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityResponseDtoUser {
  /// Returns a new [ActivityResponseDtoUser] instance.
  ActivityResponseDtoUser({
    required this.avatarColor,
    required this.email,
    required this.id,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  /// Avatar color
  ActivityResponseDtoUserAvatarColorEnum avatarColor;

  /// User email
  String email;

  /// User ID
  String id;

  /// User name
  String name;

  /// Profile change date
  DateTime profileChangedAt;

  /// Profile image path
  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityResponseDtoUser &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.id == id &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'ActivityResponseDtoUser[avatarColor=$avatarColor, email=$email, id=$id, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.profileChangedAt.millisecondsSinceEpoch
        : this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [ActivityResponseDtoUser] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityResponseDtoUser? fromJson(dynamic value) {
    upgradeDto(value, "ActivityResponseDtoUser");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityResponseDtoUser(
        avatarColor: ActivityResponseDtoUserAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<ActivityResponseDtoUser> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityResponseDtoUser>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityResponseDtoUser.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityResponseDtoUser> mapFromJson(dynamic json) {
    final map = <String, ActivityResponseDtoUser>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityResponseDtoUser.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityResponseDtoUser-objects as value to a dart map
  static Map<String, List<ActivityResponseDtoUser>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityResponseDtoUser>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityResponseDtoUser.listFromJson(entry.value, growable: growable,);
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

/// Avatar color
class ActivityResponseDtoUserAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const ActivityResponseDtoUserAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = ActivityResponseDtoUserAvatarColorEnum._(r'primary');
  static const pink = ActivityResponseDtoUserAvatarColorEnum._(r'pink');
  static const red = ActivityResponseDtoUserAvatarColorEnum._(r'red');
  static const yellow = ActivityResponseDtoUserAvatarColorEnum._(r'yellow');
  static const blue = ActivityResponseDtoUserAvatarColorEnum._(r'blue');
  static const green = ActivityResponseDtoUserAvatarColorEnum._(r'green');
  static const purple = ActivityResponseDtoUserAvatarColorEnum._(r'purple');
  static const orange = ActivityResponseDtoUserAvatarColorEnum._(r'orange');
  static const gray = ActivityResponseDtoUserAvatarColorEnum._(r'gray');
  static const amber = ActivityResponseDtoUserAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][ActivityResponseDtoUserAvatarColorEnum].
  static const values = <ActivityResponseDtoUserAvatarColorEnum>[
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

  static ActivityResponseDtoUserAvatarColorEnum? fromJson(dynamic value) => ActivityResponseDtoUserAvatarColorEnumTypeTransformer().decode(value);

  static List<ActivityResponseDtoUserAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityResponseDtoUserAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityResponseDtoUserAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ActivityResponseDtoUserAvatarColorEnum] to String,
/// and [decode] dynamic data back to [ActivityResponseDtoUserAvatarColorEnum].
class ActivityResponseDtoUserAvatarColorEnumTypeTransformer {
  factory ActivityResponseDtoUserAvatarColorEnumTypeTransformer() => _instance ??= const ActivityResponseDtoUserAvatarColorEnumTypeTransformer._();

  const ActivityResponseDtoUserAvatarColorEnumTypeTransformer._();

  String encode(ActivityResponseDtoUserAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ActivityResponseDtoUserAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ActivityResponseDtoUserAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return ActivityResponseDtoUserAvatarColorEnum.primary;
        case r'pink': return ActivityResponseDtoUserAvatarColorEnum.pink;
        case r'red': return ActivityResponseDtoUserAvatarColorEnum.red;
        case r'yellow': return ActivityResponseDtoUserAvatarColorEnum.yellow;
        case r'blue': return ActivityResponseDtoUserAvatarColorEnum.blue;
        case r'green': return ActivityResponseDtoUserAvatarColorEnum.green;
        case r'purple': return ActivityResponseDtoUserAvatarColorEnum.purple;
        case r'orange': return ActivityResponseDtoUserAvatarColorEnum.orange;
        case r'gray': return ActivityResponseDtoUserAvatarColorEnum.gray;
        case r'amber': return ActivityResponseDtoUserAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ActivityResponseDtoUserAvatarColorEnumTypeTransformer] instance.
  static ActivityResponseDtoUserAvatarColorEnumTypeTransformer? _instance;
}


