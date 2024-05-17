//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SharedLinkType {
  /// Instantiate a new enum with the provided [value].
  const SharedLinkType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ALBUM = SharedLinkType._(r'ALBUM');
  static const INDIVIDUAL = SharedLinkType._(r'INDIVIDUAL');

  /// List of all possible values in this [enum][SharedLinkType].
  static const values = <SharedLinkType>[
    ALBUM,
    INDIVIDUAL,
  ];

  static SharedLinkType? fromJson(dynamic value) => SharedLinkTypeTypeTransformer().decode(value);

  static List<SharedLinkType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedLinkType] to String,
/// and [decode] dynamic data back to [SharedLinkType].
class SharedLinkTypeTypeTransformer {
  factory SharedLinkTypeTypeTransformer() => _instance ??= const SharedLinkTypeTypeTransformer._();

  const SharedLinkTypeTypeTransformer._();

  String encode(SharedLinkType data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedLinkType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedLinkType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'ALBUM': return SharedLinkType.ALBUM;
        case r'INDIVIDUAL': return SharedLinkType.INDIVIDUAL;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedLinkTypeTypeTransformer] instance.
  static SharedLinkTypeTypeTransformer? _instance;
}

