//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class QueueCommand {
  /// Instantiate a new enum with the provided [value].
  const QueueCommand._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const start = QueueCommand._(r'start');
  static const pause = QueueCommand._(r'pause');
  static const resume = QueueCommand._(r'resume');
  static const empty = QueueCommand._(r'empty');
  static const clearFailed = QueueCommand._(r'clear-failed');

  /// List of all possible values in this [enum][QueueCommand].
  static const values = <QueueCommand>[
    start,
    pause,
    resume,
    empty,
    clearFailed,
  ];

  static QueueCommand? fromJson(dynamic value) => QueueCommandTypeTransformer().decode(value);

  static List<QueueCommand> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueCommand>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueCommand.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [QueueCommand] to String,
/// and [decode] dynamic data back to [QueueCommand].
class QueueCommandTypeTransformer {
  factory QueueCommandTypeTransformer() => _instance ??= const QueueCommandTypeTransformer._();

  const QueueCommandTypeTransformer._();

  String encode(QueueCommand data) => data.value;

  /// Decodes a [dynamic value][data] to a QueueCommand.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  QueueCommand? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'start': return QueueCommand.start;
        case r'pause': return QueueCommand.pause;
        case r'resume': return QueueCommand.resume;
        case r'empty': return QueueCommand.empty;
        case r'clear-failed': return QueueCommand.clearFailed;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [QueueCommandTypeTransformer] instance.
  static QueueCommandTypeTransformer? _instance;
}

