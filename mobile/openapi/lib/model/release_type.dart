//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


enum ReleaseType {
  major._(r'major'),
  premajor._(r'premajor'),
  minor._(r'minor'),
  preminor._(r'preminor'),
  patch_._(r'patch'),
  prepatch._(r'prepatch'),
  prerelease._(r'prerelease'),
  ;

  /// Instantiate a new enum with the provided value.
  const ReleaseType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ReleaseType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ReleaseType? fromJson(dynamic value) => ReleaseTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ReleaseType]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ReleaseType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReleaseType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReleaseType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ReleaseType] to String,
/// and [decode] dynamic data back to [ReleaseType].
class ReleaseTypeTypeTransformer {
  factory ReleaseTypeTypeTransformer() => _instance ??= const ReleaseTypeTypeTransformer._();

  const ReleaseTypeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(ReleaseType data) => data._value;

  /// Returns the instance of [ReleaseType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReleaseType? decode(dynamic data, {bool allowNull = true}) {
    if (data is ReleaseType) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'major': return ReleaseType.major;
        case r'premajor': return ReleaseType.premajor;
        case r'minor': return ReleaseType.minor;
        case r'preminor': return ReleaseType.preminor;
        case r'patch': return ReleaseType.patch_;
        case r'prepatch': return ReleaseType.prepatch;
        case r'prerelease': return ReleaseType.prerelease;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ReleaseTypeTypeTransformer? _instance;
}

