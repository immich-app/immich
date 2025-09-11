//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AccessHint {
  /// Instantiate a new enum with the provided [value].
  const AccessHint._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const owner = AccessHint._(r'owner');
  static const album = AccessHint._(r'album');
  static const partner = AccessHint._(r'partner');
  static const sharedLink = AccessHint._(r'sharedLink');

  /// List of all possible values in this [enum][AccessHint].
  static const values = <AccessHint>[
    owner,
    album,
    partner,
    sharedLink,
  ];

  static AccessHint? fromJson(dynamic value) => AccessHintTypeTransformer().decode(value);

  static List<AccessHint> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AccessHint>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AccessHint.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AccessHint] to String,
/// and [decode] dynamic data back to [AccessHint].
class AccessHintTypeTransformer {
  factory AccessHintTypeTransformer() => _instance ??= const AccessHintTypeTransformer._();

  const AccessHintTypeTransformer._();

  String encode(AccessHint data) => data.value;

  /// Decodes a [dynamic value][data] to a AccessHint.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AccessHint? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'owner': return AccessHint.owner;
        case r'album': return AccessHint.album;
        case r'partner': return AccessHint.partner;
        case r'sharedLink': return AccessHint.sharedLink;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AccessHintTypeTransformer] instance.
  static AccessHintTypeTransformer? _instance;
}

