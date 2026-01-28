//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DatabaseBackup {
  /// Instantiate a new enum with the provided [value].
  const DatabaseBackup._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const databaseBackup = DatabaseBackup._(r'DatabaseBackup');

  /// List of all possible values in this [enum][DatabaseBackup].
  static const values = <DatabaseBackup>[
    databaseBackup,
  ];

  static DatabaseBackup? fromJson(dynamic value) => DatabaseBackupTypeTransformer().decode(value);

  static List<DatabaseBackup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DatabaseBackup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DatabaseBackup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DatabaseBackup] to String,
/// and [decode] dynamic data back to [DatabaseBackup].
class DatabaseBackupTypeTransformer {
  factory DatabaseBackupTypeTransformer() => _instance ??= const DatabaseBackupTypeTransformer._();

  const DatabaseBackupTypeTransformer._();

  String encode(DatabaseBackup data) => data.value;

  /// Decodes a [dynamic value][data] to a DatabaseBackup.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DatabaseBackup? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'DatabaseBackup': return DatabaseBackup.databaseBackup;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DatabaseBackupTypeTransformer] instance.
  static DatabaseBackupTypeTransformer? _instance;
}

