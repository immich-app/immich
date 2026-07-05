//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Error reason if failed
class AssetIdErrorReason {
  /// Instantiate a new enum with the provided [value].
  const AssetIdErrorReason._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = AssetIdErrorReason._(r'duplicate');
  static const noPermission = AssetIdErrorReason._(r'no_permission');
  static const notFound = AssetIdErrorReason._(r'not_found');

  /// List of all possible values in this [enum][AssetIdErrorReason].
  static const values = <AssetIdErrorReason>[
    duplicate,
    noPermission,
    notFound,
  ];

  static AssetIdErrorReason? fromJson(dynamic value) => AssetIdErrorReasonTypeTransformer().decode(value);

  static List<AssetIdErrorReason> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetIdErrorReason>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetIdErrorReason.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetIdErrorReason] to String,
/// and [decode] dynamic data back to [AssetIdErrorReason].
class AssetIdErrorReasonTypeTransformer {
  factory AssetIdErrorReasonTypeTransformer() => _instance ??= const AssetIdErrorReasonTypeTransformer._();

  const AssetIdErrorReasonTypeTransformer._();

  String encode(AssetIdErrorReason data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetIdErrorReason.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetIdErrorReason? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return AssetIdErrorReason.duplicate;
        case r'no_permission': return AssetIdErrorReason.noPermission;
        case r'not_found': return AssetIdErrorReason.notFound;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetIdErrorReasonTypeTransformer] instance.
  static AssetIdErrorReasonTypeTransformer? _instance;
}

