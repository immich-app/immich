//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class NotificationType {
  /// Instantiate a new enum with the provided [value].
  const NotificationType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const jobFailed = NotificationType._(r'JobFailed');
  static const backupFailed = NotificationType._(r'BackupFailed');
  static const systemMessage = NotificationType._(r'SystemMessage');
  static const custom = NotificationType._(r'Custom');

  /// List of all possible values in this [enum][NotificationType].
  static const values = <NotificationType>[
    jobFailed,
    backupFailed,
    systemMessage,
    custom,
  ];

  static NotificationType? fromJson(dynamic value) => NotificationTypeTypeTransformer().decode(value);

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

  String encode(NotificationType data) => data.value;

  /// Decodes a [dynamic value][data] to a NotificationType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  NotificationType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'JobFailed': return NotificationType.jobFailed;
        case r'BackupFailed': return NotificationType.backupFailed;
        case r'SystemMessage': return NotificationType.systemMessage;
        case r'Custom': return NotificationType.custom;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [NotificationTypeTypeTransformer] instance.
  static NotificationTypeTypeTransformer? _instance;
}

