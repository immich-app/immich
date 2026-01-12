//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PersonCleanup {
  /// Instantiate a new enum with the provided [value].
  const PersonCleanup._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const personCleanup = PersonCleanup._(r'PersonCleanup');

  /// List of all possible values in this [enum][PersonCleanup].
  static const values = <PersonCleanup>[
    personCleanup,
  ];

  static PersonCleanup? fromJson(dynamic value) => PersonCleanupTypeTransformer().decode(value);

  static List<PersonCleanup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonCleanup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonCleanup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PersonCleanup] to String,
/// and [decode] dynamic data back to [PersonCleanup].
class PersonCleanupTypeTransformer {
  factory PersonCleanupTypeTransformer() => _instance ??= const PersonCleanupTypeTransformer._();

  const PersonCleanupTypeTransformer._();

  String encode(PersonCleanup data) => data.value;

  /// Decodes a [dynamic value][data] to a PersonCleanup.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PersonCleanup? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'PersonCleanup': return PersonCleanup.personCleanup;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PersonCleanupTypeTransformer] instance.
  static PersonCleanupTypeTransformer? _instance;
}

