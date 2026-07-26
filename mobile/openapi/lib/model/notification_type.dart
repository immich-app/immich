//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Notification type
enum NotificationType {
  jobFailed._(r'JobFailed'),
  backupFailed._(r'BackupFailed'),
  systemMessage._(r'SystemMessage'),
  albumInvite._(r'AlbumInvite'),
  albumUpdate._(r'AlbumUpdate'),
  custom._(r'Custom'),
  ;

  /// Instantiate a new enum with the provided value.
  const NotificationType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [NotificationType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static NotificationType? fromJson(dynamic value) => NotificationTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [NotificationType]
  /// that were successfully decoded from the passed [JSON][json].
  static List<NotificationType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [NotificationType] to String,
/// and [decode] dynamic data back to [NotificationType].
class NotificationTypeTypeTransformer {
  factory NotificationTypeTypeTransformer() => _instance ??= const NotificationTypeTypeTransformer._();

  const NotificationTypeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(NotificationType data) => data._value;

  /// Returns the instance of [NotificationType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  NotificationType? decode(dynamic data, {bool allowNull = true}) {
    if (data is NotificationType) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'JobFailed': return NotificationType.jobFailed;
        case r'BackupFailed': return NotificationType.backupFailed;
        case r'SystemMessage': return NotificationType.systemMessage;
        case r'AlbumInvite': return NotificationType.albumInvite;
        case r'AlbumUpdate': return NotificationType.albumUpdate;
        case r'Custom': return NotificationType.custom;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static NotificationTypeTypeTransformer? _instance;
}

