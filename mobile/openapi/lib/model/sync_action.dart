//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncAction {
  /// Instantiate a new enum with the provided [value].
  const SyncAction._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const upsert = SyncAction._(r'upsert');
  static const delete = SyncAction._(r'delete');

  /// List of all possible values in this [enum][SyncAction].
  static const values = <SyncAction>[
    upsert,
    delete,
  ];

  static SyncAction? fromJson(dynamic value) => SyncActionTypeTransformer().decode(value);

  static List<SyncAction> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAction>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAction.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncAction] to String,
/// and [decode] dynamic data back to [SyncAction].
class SyncActionTypeTransformer {
  factory SyncActionTypeTransformer() => _instance ??= const SyncActionTypeTransformer._();

  const SyncActionTypeTransformer._();

  String encode(SyncAction data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncAction.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncAction? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'upsert': return SyncAction.upsert;
        case r'delete': return SyncAction.delete;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncActionTypeTransformer] instance.
  static SyncActionTypeTransformer? _instance;
}

