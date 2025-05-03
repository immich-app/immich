//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class NotificationLevel {
  /// Instantiate a new enum with the provided [value].
  const NotificationLevel._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const success = NotificationLevel._(r'success');
  static const error = NotificationLevel._(r'error');
  static const warning = NotificationLevel._(r'warning');
  static const info = NotificationLevel._(r'info');

  /// List of all possible values in this [enum][NotificationLevel].
  static const values = <NotificationLevel>[
    success,
    error,
    warning,
    info,
  ];

  static NotificationLevel? fromJson(dynamic value) => NotificationLevelTypeTransformer().decode(value);

  static List<NotificationLevel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationLevel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationLevel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [NotificationLevel] to String,
/// and [decode] dynamic data back to [NotificationLevel].
class NotificationLevelTypeTransformer {
  factory NotificationLevelTypeTransformer() => _instance ??= const NotificationLevelTypeTransformer._();

  const NotificationLevelTypeTransformer._();

  String encode(NotificationLevel data) => data.value;

  /// Decodes a [dynamic value][data] to a NotificationLevel.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  NotificationLevel? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'success': return NotificationLevel.success;
        case r'error': return NotificationLevel.error;
        case r'warning': return NotificationLevel.warning;
        case r'info': return NotificationLevel.info;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [NotificationLevelTypeTransformer] instance.
  static NotificationLevelTypeTransformer? _instance;
}

