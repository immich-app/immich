//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Date for asset order
class OrderingDate {
  /// Instantiate a new enum with the provided [value].
  const OrderingDate._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const local = OrderingDate._(r'local');
  static const created = OrderingDate._(r'created');

  /// List of all possible values in this [enum][OrderingDate].
  static const values = <OrderingDate>[
    local,
    created,
  ];

  static OrderingDate? fromJson(dynamic value) => OrderingDateTypeTransformer().decode(value);

  static List<OrderingDate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OrderingDate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OrderingDate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [OrderingDate] to String,
/// and [decode] dynamic data back to [OrderingDate].
class OrderingDateTypeTransformer {
  factory OrderingDateTypeTransformer() => _instance ??= const OrderingDateTypeTransformer._();

  const OrderingDateTypeTransformer._();

  String encode(OrderingDate data) => data.value;

  /// Decodes a [dynamic value][data] to a OrderingDate.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  OrderingDate? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'local': return OrderingDate.local;
        case r'created': return OrderingDate.created;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [OrderingDateTypeTransformer] instance.
  static OrderingDateTypeTransformer? _instance;
}

