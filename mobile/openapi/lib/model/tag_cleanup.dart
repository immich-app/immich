//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TagCleanup {
  /// Instantiate a new enum with the provided [value].
  const TagCleanup._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const tagCleanup = TagCleanup._(r'TagCleanup');

  /// List of all possible values in this [enum][TagCleanup].
  static const values = <TagCleanup>[
    tagCleanup,
  ];

  static TagCleanup? fromJson(dynamic value) => TagCleanupTypeTransformer().decode(value);

  static List<TagCleanup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagCleanup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagCleanup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TagCleanup] to String,
/// and [decode] dynamic data back to [TagCleanup].
class TagCleanupTypeTransformer {
  factory TagCleanupTypeTransformer() => _instance ??= const TagCleanupTypeTransformer._();

  const TagCleanupTypeTransformer._();

  String encode(TagCleanup data) => data.value;

  /// Decodes a [dynamic value][data] to a TagCleanup.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TagCleanup? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'TagCleanup': return TagCleanup.tagCleanup;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TagCleanupTypeTransformer] instance.
  static TagCleanupTypeTransformer? _instance;
}

