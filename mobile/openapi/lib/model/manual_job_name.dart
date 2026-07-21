//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Manual job name
enum ManualJobName {
  personCleanup._(r'person-cleanup'),
  tagCleanup._(r'tag-cleanup'),
  userCleanup._(r'user-cleanup'),
  memoryCleanup._(r'memory-cleanup'),
  memoryCreate._(r'memory-create'),
  backupDatabase._(r'backup-database'),
  integrityMissingFiles._(r'integrity-missing-files'),
  integrityUntrackedFiles._(r'integrity-untracked-files'),
  integrityChecksumMismatch._(r'integrity-checksum-mismatch'),
  integrityMissingFilesRefresh._(r'integrity-missing-files-refresh'),
  integrityUntrackedFilesRefresh._(r'integrity-untracked-files-refresh'),
  integrityChecksumMismatchRefresh._(r'integrity-checksum-mismatch-refresh'),
  integrityMissingFilesDeleteAll._(r'integrity-missing-files-delete-all'),
  integrityUntrackedFilesDeleteAll._(r'integrity-untracked-files-delete-all'),
  integrityChecksumMismatchDeleteAll._(r'integrity-checksum-mismatch-delete-all'),
  ;

  /// Instantiate a new enum with the provided value.
  const ManualJobName._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ManualJobName] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ManualJobName? fromJson(dynamic value) => ManualJobNameTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ManualJobName]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(ManualJobName data) => data._value;

  /// Returns the instance of [ManualJobName] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ManualJobName? decode(dynamic data, {bool allowNull = true}) {
    if (data is ManualJobName) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'person-cleanup': return ManualJobName.personCleanup;
        case r'tag-cleanup': return ManualJobName.tagCleanup;
        case r'user-cleanup': return ManualJobName.userCleanup;
        case r'memory-cleanup': return ManualJobName.memoryCleanup;
        case r'memory-create': return ManualJobName.memoryCreate;
        case r'backup-database': return ManualJobName.backupDatabase;
        case r'integrity-missing-files': return ManualJobName.integrityMissingFiles;
        case r'integrity-untracked-files': return ManualJobName.integrityUntrackedFiles;
        case r'integrity-checksum-mismatch': return ManualJobName.integrityChecksumMismatch;
        case r'integrity-missing-files-refresh': return ManualJobName.integrityMissingFilesRefresh;
        case r'integrity-untracked-files-refresh': return ManualJobName.integrityUntrackedFilesRefresh;
        case r'integrity-checksum-mismatch-refresh': return ManualJobName.integrityChecksumMismatchRefresh;
        case r'integrity-missing-files-delete-all': return ManualJobName.integrityMissingFilesDeleteAll;
        case r'integrity-untracked-files-delete-all': return ManualJobName.integrityUntrackedFilesDeleteAll;
        case r'integrity-checksum-mismatch-delete-all': return ManualJobName.integrityChecksumMismatchDeleteAll;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ManualJobNameTypeTransformer? _instance;
}

