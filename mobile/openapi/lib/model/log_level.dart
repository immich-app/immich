//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LogLevel {
  /// Instantiate a new enum with the provided [value].
  const LogLevel._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const verbose = LogLevel._(r'verbose');
  static const debug = LogLevel._(r'debug');
  static const log = LogLevel._(r'log');
  static const warn = LogLevel._(r'warn');
  static const error = LogLevel._(r'error');
  static const fatal = LogLevel._(r'fatal');

  /// List of all possible values in this [enum][LogLevel].
  static const values = <LogLevel>[
    verbose,
    debug,
    log,
    warn,
    error,
    fatal,
  ];

  static LogLevel? fromJson(dynamic value) => LogLevelTypeTransformer().decode(value);

  static List<LogLevel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LogLevel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LogLevel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LogLevel] to String,
/// and [decode] dynamic data back to [LogLevel].
class LogLevelTypeTransformer {
  factory LogLevelTypeTransformer() => _instance ??= const LogLevelTypeTransformer._();

  const LogLevelTypeTransformer._();

  String encode(LogLevel data) => data.value;

  /// Decodes a [dynamic value][data] to a LogLevel.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LogLevel? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'verbose': return LogLevel.verbose;
        case r'debug': return LogLevel.debug;
        case r'log': return LogLevel.log;
        case r'warn': return LogLevel.warn;
        case r'error': return LogLevel.error;
        case r'fatal': return LogLevel.fatal;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [LogLevelTypeTransformer] instance.
  static LogLevelTypeTransformer? _instance;
}

