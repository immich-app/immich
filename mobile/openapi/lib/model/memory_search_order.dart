//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MemorySearchOrder {
  /// Instantiate a new enum with the provided [value].
  const MemorySearchOrder._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asc = MemorySearchOrder._(r'asc');
  static const desc = MemorySearchOrder._(r'desc');
  static const random = MemorySearchOrder._(r'random');

  /// List of all possible values in this [enum][MemorySearchOrder].
  static const values = <MemorySearchOrder>[
    asc,
    desc,
    random,
  ];

  static MemorySearchOrder? fromJson(dynamic value) => MemorySearchOrderTypeTransformer().decode(value);

  static List<MemorySearchOrder> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemorySearchOrder>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemorySearchOrder.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemorySearchOrder] to String,
/// and [decode] dynamic data back to [MemorySearchOrder].
class MemorySearchOrderTypeTransformer {
  factory MemorySearchOrderTypeTransformer() => _instance ??= const MemorySearchOrderTypeTransformer._();

  const MemorySearchOrderTypeTransformer._();

  String encode(MemorySearchOrder data) => data.value;

  /// Decodes a [dynamic value][data] to a MemorySearchOrder.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemorySearchOrder? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asc': return MemorySearchOrder.asc;
        case r'desc': return MemorySearchOrder.desc;
        case r'random': return MemorySearchOrder.random;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MemorySearchOrderTypeTransformer] instance.
  static MemorySearchOrderTypeTransformer? _instance;
}

