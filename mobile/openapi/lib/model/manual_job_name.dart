//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ManualJobName {
  /// Instantiate a new enum with the provided [value].
  const ManualJobName._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const personCleanup = ManualJobName._(r'person-cleanup');
  static const tagCleanup = ManualJobName._(r'tag-cleanup');
  static const userCleanup = ManualJobName._(r'user-cleanup');
  static const memoryCleanup = ManualJobName._(r'memory-cleanup');
  static const memoryCreate = ManualJobName._(r'memory-create');
  static const backupDatabase = ManualJobName._(r'backup-database');

  /// List of all possible values in this [enum][ManualJobName].
  static const values = <ManualJobName>[
    personCleanup,
    tagCleanup,
    userCleanup,
    memoryCleanup,
    memoryCreate,
    backupDatabase,
  ];

  static ManualJobName? fromJson(dynamic value) => ManualJobNameTypeTransformer().decode(value);

  static List<ManualJobName> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ManualJobName>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ManualJobName.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ManualJobName] to String,
/// and [decode] dynamic data back to [ManualJobName].
class ManualJobNameTypeTransformer {
  factory ManualJobNameTypeTransformer() => _instance ??= const ManualJobNameTypeTransformer._();

  const ManualJobNameTypeTransformer._();

  String encode(ManualJobName data) => data.value;

  /// Decodes a [dynamic value][data] to a ManualJobName.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ManualJobName? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'person-cleanup': return ManualJobName.personCleanup;
        case r'tag-cleanup': return ManualJobName.tagCleanup;
        case r'user-cleanup': return ManualJobName.userCleanup;
        case r'memory-cleanup': return ManualJobName.memoryCleanup;
        case r'memory-create': return ManualJobName.memoryCreate;
        case r'backup-database': return ManualJobName.backupDatabase;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ManualJobNameTypeTransformer] instance.
  static ManualJobNameTypeTransformer? _instance;
}

