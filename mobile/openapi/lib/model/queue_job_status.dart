//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class QueueJobStatus {
  /// Instantiate a new enum with the provided [value].
  const QueueJobStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const active = QueueJobStatus._(r'active');
  static const failed = QueueJobStatus._(r'failed');
  static const completed = QueueJobStatus._(r'completed');
  static const delayed = QueueJobStatus._(r'delayed');
  static const waiting = QueueJobStatus._(r'waiting');
  static const paused = QueueJobStatus._(r'paused');

  /// List of all possible values in this [enum][QueueJobStatus].
  static const values = <QueueJobStatus>[
    active,
    failed,
    completed,
    delayed,
    waiting,
    paused,
  ];

  static QueueJobStatus? fromJson(dynamic value) => QueueJobStatusTypeTransformer().decode(value);

  static List<QueueJobStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueJobStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueJobStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [QueueJobStatus] to String,
/// and [decode] dynamic data back to [QueueJobStatus].
class QueueJobStatusTypeTransformer {
  factory QueueJobStatusTypeTransformer() => _instance ??= const QueueJobStatusTypeTransformer._();

  const QueueJobStatusTypeTransformer._();

  String encode(QueueJobStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a QueueJobStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  QueueJobStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'active': return QueueJobStatus.active;
        case r'failed': return QueueJobStatus.failed;
        case r'completed': return QueueJobStatus.completed;
        case r'delayed': return QueueJobStatus.delayed;
        case r'waiting': return QueueJobStatus.waiting;
        case r'paused': return QueueJobStatus.paused;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [QueueJobStatusTypeTransformer] instance.
  static QueueJobStatusTypeTransformer? _instance;
}

