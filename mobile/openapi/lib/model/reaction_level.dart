//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ReactionLevel {
  /// Instantiate a new enum with the provided [value].
  const ReactionLevel._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const album = ReactionLevel._(r'album');
  static const asset = ReactionLevel._(r'asset');

  /// List of all possible values in this [enum][ReactionLevel].
  static const values = <ReactionLevel>[
    album,
    asset,
  ];

  static ReactionLevel? fromJson(dynamic value) => ReactionLevelTypeTransformer().decode(value);

  static List<ReactionLevel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReactionLevel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReactionLevel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ReactionLevel] to String,
/// and [decode] dynamic data back to [ReactionLevel].
class ReactionLevelTypeTransformer {
  factory ReactionLevelTypeTransformer() => _instance ??= const ReactionLevelTypeTransformer._();

  const ReactionLevelTypeTransformer._();

  String encode(ReactionLevel data) => data.value;

  /// Decodes a [dynamic value][data] to a ReactionLevel.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReactionLevel? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'album': return ReactionLevel.album;
        case r'asset': return ReactionLevel.asset;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ReactionLevelTypeTransformer] instance.
  static ReactionLevelTypeTransformer? _instance;
}

