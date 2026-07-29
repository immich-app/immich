//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Notification level
enum NotificationLevel {
  success._(r'success'),
  error._(r'error'),
  warning._(r'warning'),
  info._(r'info'),
  ;

  /// Instantiate a new enum with the provided value.
  const NotificationLevel._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [NotificationLevel] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static NotificationLevel? fromJson(dynamic value) => NotificationLevelTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [NotificationLevel]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(NotificationLevel data) => data._value;

  /// Returns the instance of [NotificationLevel] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  NotificationLevel? decode(dynamic data, {bool allowNull = true}) {
    if (data is NotificationLevel) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static NotificationLevelTypeTransformer? _instance;
}

