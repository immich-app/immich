//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DeleteAssetStatus {
  /// Instantiate a new enum with the provided [value].
  const DeleteAssetStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const SUCCESS = DeleteAssetStatus._(r'SUCCESS');
  static const FAILED = DeleteAssetStatus._(r'FAILED');

  /// List of all possible values in this [enum][DeleteAssetStatus].
  static const values = <DeleteAssetStatus>[
    SUCCESS,
    FAILED,
  ];

  static DeleteAssetStatus? fromJson(dynamic value) => DeleteAssetStatusTypeTransformer().decode(value);

  static List<DeleteAssetStatus>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DeleteAssetStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DeleteAssetStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DeleteAssetStatus] to String,
/// and [decode] dynamic data back to [DeleteAssetStatus].
class DeleteAssetStatusTypeTransformer {
  factory DeleteAssetStatusTypeTransformer() => _instance ??= const DeleteAssetStatusTypeTransformer._();

  const DeleteAssetStatusTypeTransformer._();

  String encode(DeleteAssetStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a DeleteAssetStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DeleteAssetStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'SUCCESS': return DeleteAssetStatus.SUCCESS;
        case r'FAILED': return DeleteAssetStatus.FAILED;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DeleteAssetStatusTypeTransformer] instance.
  static DeleteAssetStatusTypeTransformer? _instance;
}

