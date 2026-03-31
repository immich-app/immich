//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Person type
class PersonType {
  /// Instantiate a new enum with the provided [value].
  const PersonType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const HUMAN = PersonType._(r'HUMAN');
  static const PET = PersonType._(r'PET');

  /// List of all possible values in this [enum][PersonType].
  static const values = <PersonType>[
    HUMAN,
    PET,
  ];

  static PersonType? fromJson(dynamic value) => PersonTypeTypeTransformer().decode(value);

  static List<PersonType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PersonType] to String,
/// and [decode] dynamic data back to [PersonType].
class PersonTypeTypeTransformer {
  factory PersonTypeTypeTransformer() => _instance ??= const PersonTypeTypeTransformer._();

  const PersonTypeTypeTransformer._();

  String encode(PersonType data) => data.value;

  /// Decodes a [dynamic value][data] to a PersonType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PersonType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'HUMAN': return PersonType.HUMAN;
        case r'PET': return PersonType.PET;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PersonTypeTypeTransformer] instance.
  static PersonTypeTypeTransformer? _instance;
}

