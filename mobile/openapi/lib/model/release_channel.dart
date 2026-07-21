//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Release channel
enum ReleaseChannel {
  stable._(r'stable'),
  releaseCandidate._(r'releaseCandidate'),
  ;

  /// Instantiate a new enum with the provided value.
  const ReleaseChannel._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ReleaseChannel] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ReleaseChannel? fromJson(dynamic value) => ReleaseChannelTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ReleaseChannel]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ReleaseChannel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReleaseChannel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReleaseChannel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ReleaseChannel] to String,
/// and [decode] dynamic data back to [ReleaseChannel].
class ReleaseChannelTypeTransformer {
  factory ReleaseChannelTypeTransformer() => _instance ??= const ReleaseChannelTypeTransformer._();

  const ReleaseChannelTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(ReleaseChannel data) => data._value;

  /// Returns the instance of [ReleaseChannel] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReleaseChannel? decode(dynamic data, {bool allowNull = true}) {
    if (data is ReleaseChannel) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'stable': return ReleaseChannel.stable;
        case r'releaseCandidate': return ReleaseChannel.releaseCandidate;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ReleaseChannelTypeTransformer? _instance;
}

