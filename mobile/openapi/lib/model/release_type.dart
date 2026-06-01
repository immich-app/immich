//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ReleaseType {
  /// Instantiate a new enum with the provided [value].
  const ReleaseType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const major = ReleaseType._(r'major');
  static const premajor = ReleaseType._(r'premajor');
  static const minor = ReleaseType._(r'minor');
  static const preminor = ReleaseType._(r'preminor');
  static const patch_ = ReleaseType._(r'patch');
  static const prepatch = ReleaseType._(r'prepatch');
  static const prerelease = ReleaseType._(r'prerelease');

  /// List of all possible values in this [enum][ReleaseType].
  static const values = <ReleaseType>[
    major,
    premajor,
    minor,
    preminor,
    patch_,
    prepatch,
    prerelease,
  ];

  static ReleaseType? fromJson(dynamic value) => ReleaseTypeTypeTransformer().decode(value);

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

  String encode(ReleaseType data) => data.value;

  /// Decodes a [dynamic value][data] to a ReleaseType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReleaseType? decode(dynamic data, {bool allowNull = true}) {
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

  /// Singleton [ReleaseTypeTypeTransformer] instance.
  static ReleaseTypeTypeTransformer? _instance;
}

