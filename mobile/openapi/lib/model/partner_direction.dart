//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PartnerDirection {
  /// Instantiate a new enum with the provided [value].
  const PartnerDirection._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const by = PartnerDirection._(r'shared-by');
  static const with_ = PartnerDirection._(r'shared-with');

  /// List of all possible values in this [enum][PartnerDirection].
  static const values = <PartnerDirection>[
    by,
    with_,
  ];

  static PartnerDirection? fromJson(dynamic value) => PartnerDirectionTypeTransformer().decode(value);

  static List<PartnerDirection> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartnerDirection>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartnerDirection.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PartnerDirection] to String,
/// and [decode] dynamic data back to [PartnerDirection].
class PartnerDirectionTypeTransformer {
  factory PartnerDirectionTypeTransformer() => _instance ??= const PartnerDirectionTypeTransformer._();

  const PartnerDirectionTypeTransformer._();

  String encode(PartnerDirection data) => data.value;

  /// Decodes a [dynamic value][data] to a PartnerDirection.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PartnerDirection? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'shared-by': return PartnerDirection.by;
        case r'shared-with': return PartnerDirection.with_;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PartnerDirectionTypeTransformer] instance.
  static PartnerDirectionTypeTransformer? _instance;
}

