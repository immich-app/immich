//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PathEntityType {
  /// Instantiate a new enum with the provided [value].
  const PathEntityType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = PathEntityType._(r'asset');
  static const person = PathEntityType._(r'person');
  static const user = PathEntityType._(r'user');

  /// List of all possible values in this [enum][PathEntityType].
  static const values = <PathEntityType>[
    asset,
    person,
    user,
  ];

  static PathEntityType? fromJson(dynamic value) => PathEntityTypeTypeTransformer().decode(value);

  static List<PathEntityType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PathEntityType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PathEntityType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PathEntityType] to String,
/// and [decode] dynamic data back to [PathEntityType].
class PathEntityTypeTypeTransformer {
  factory PathEntityTypeTypeTransformer() => _instance ??= const PathEntityTypeTypeTransformer._();

  const PathEntityTypeTypeTransformer._();

  String encode(PathEntityType data) => data.value;

  /// Decodes a [dynamic value][data] to a PathEntityType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PathEntityType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return PathEntityType.asset;
        case r'person': return PathEntityType.person;
        case r'user': return PathEntityType.user;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PathEntityTypeTypeTransformer] instance.
  static PathEntityTypeTypeTransformer? _instance;
}

