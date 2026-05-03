//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScopedPrimaryProfile {
  /// Returns a new [ScopedPrimaryProfile] instance.
  ScopedPrimaryProfile({
    required this.id,
    this.spaceId,
    required this.type,
  });

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? spaceId;

  ScopedPrimaryProfileTypeEnum type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScopedPrimaryProfile &&
    other.id == id &&
    other.spaceId == spaceId &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (spaceId == null ? 0 : spaceId!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'ScopedPrimaryProfile[id=$id, spaceId=$spaceId, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
    if (this.spaceId != null) {
      json[r'spaceId'] = this.spaceId;
    } else {
    //  json[r'spaceId'] = null;
    }
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [ScopedPrimaryProfile] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScopedPrimaryProfile? fromJson(dynamic value) {
    upgradeDto(value, "ScopedPrimaryProfile");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScopedPrimaryProfile(
        id: mapValueOfType<String>(json, r'id')!,
        spaceId: mapValueOfType<String>(json, r'spaceId'),
        type: ScopedPrimaryProfileTypeEnum.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<ScopedPrimaryProfile> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScopedPrimaryProfile>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScopedPrimaryProfile.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScopedPrimaryProfile> mapFromJson(dynamic json) {
    final map = <String, ScopedPrimaryProfile>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScopedPrimaryProfile.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScopedPrimaryProfile-objects as value to a dart map
  static Map<String, List<ScopedPrimaryProfile>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScopedPrimaryProfile>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScopedPrimaryProfile.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'type',
  };
}


class ScopedPrimaryProfileTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ScopedPrimaryProfileTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const userPerson = ScopedPrimaryProfileTypeEnum._(r'user-person');
  static const spacePerson = ScopedPrimaryProfileTypeEnum._(r'space-person');

  /// List of all possible values in this [enum][ScopedPrimaryProfileTypeEnum].
  static const values = <ScopedPrimaryProfileTypeEnum>[
    userPerson,
    spacePerson,
  ];

  static ScopedPrimaryProfileTypeEnum? fromJson(dynamic value) => ScopedPrimaryProfileTypeEnumTypeTransformer().decode(value);

  static List<ScopedPrimaryProfileTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScopedPrimaryProfileTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScopedPrimaryProfileTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ScopedPrimaryProfileTypeEnum] to String,
/// and [decode] dynamic data back to [ScopedPrimaryProfileTypeEnum].
class ScopedPrimaryProfileTypeEnumTypeTransformer {
  factory ScopedPrimaryProfileTypeEnumTypeTransformer() => _instance ??= const ScopedPrimaryProfileTypeEnumTypeTransformer._();

  const ScopedPrimaryProfileTypeEnumTypeTransformer._();

  String encode(ScopedPrimaryProfileTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ScopedPrimaryProfileTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ScopedPrimaryProfileTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'user-person': return ScopedPrimaryProfileTypeEnum.userPerson;
        case r'space-person': return ScopedPrimaryProfileTypeEnum.spacePerson;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ScopedPrimaryProfileTypeEnumTypeTransformer] instance.
  static ScopedPrimaryProfileTypeEnumTypeTransformer? _instance;
}


