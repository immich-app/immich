//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RuleKey {
  /// Instantiate a new enum with the provided [value].
  const RuleKey._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const person = RuleKey._(r'person');
  static const takenAfter = RuleKey._(r'taken-after');
  static const city = RuleKey._(r'city');
  static const state = RuleKey._(r'state');
  static const country = RuleKey._(r'country');
  static const cameraMake = RuleKey._(r'camera-make');
  static const cameraModel = RuleKey._(r'camera-model');
  static const location = RuleKey._(r'location');

  /// List of all possible values in this [enum][RuleKey].
  static const values = <RuleKey>[
    person,
    takenAfter,
    city,
    state,
    country,
    cameraMake,
    cameraModel,
    location,
  ];

  static RuleKey? fromJson(dynamic value) => RuleKeyTypeTransformer().decode(value);

  static List<RuleKey>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RuleKey>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RuleKey.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RuleKey] to String,
/// and [decode] dynamic data back to [RuleKey].
class RuleKeyTypeTransformer {
  factory RuleKeyTypeTransformer() => _instance ??= const RuleKeyTypeTransformer._();

  const RuleKeyTypeTransformer._();

  String encode(RuleKey data) => data.value;

  /// Decodes a [dynamic value][data] to a RuleKey.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RuleKey? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'person': return RuleKey.person;
        case r'taken-after': return RuleKey.takenAfter;
        case r'city': return RuleKey.city;
        case r'state': return RuleKey.state;
        case r'country': return RuleKey.country;
        case r'camera-make': return RuleKey.cameraMake;
        case r'camera-model': return RuleKey.cameraModel;
        case r'location': return RuleKey.location;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [RuleKeyTypeTransformer] instance.
  static RuleKeyTypeTransformer? _instance;
}

