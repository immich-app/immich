//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Rejection reason if rejected
class AssetRejectReason {
  /// Instantiate a new enum with the provided [value].
  const AssetRejectReason._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = AssetRejectReason._(r'duplicate');
  static const unsupportedFormat = AssetRejectReason._(r'unsupported-format');

  /// List of all possible values in this [enum][AssetRejectReason].
  static const values = <AssetRejectReason>[
    duplicate,
    unsupportedFormat,
  ];

  static AssetRejectReason? fromJson(dynamic value) => AssetRejectReasonTypeTransformer().decode(value);

  static List<AssetRejectReason> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetRejectReason>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetRejectReason.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetRejectReason] to String,
/// and [decode] dynamic data back to [AssetRejectReason].
class AssetRejectReasonTypeTransformer {
  factory AssetRejectReasonTypeTransformer() => _instance ??= const AssetRejectReasonTypeTransformer._();

  const AssetRejectReasonTypeTransformer._();

  String encode(AssetRejectReason data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetRejectReason.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetRejectReason? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return AssetRejectReason.duplicate;
        case r'unsupported-format': return AssetRejectReason.unsupportedFormat;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetRejectReasonTypeTransformer] instance.
  static AssetRejectReasonTypeTransformer? _instance;
}

