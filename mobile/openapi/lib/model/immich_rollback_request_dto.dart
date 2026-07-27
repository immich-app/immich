//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImmichRollbackRequestDto {
  /// Returns a new [ImmichRollbackRequestDto] instance.
  ImmichRollbackRequestDto({
    this.backupFileName = const Optional.absent(),
    required this.repositoryId,
    required this.snapshotId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> backupFileName;

  String repositoryId;

  String snapshotId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImmichRollbackRequestDto &&
    other.backupFileName == backupFileName &&
    other.repositoryId == repositoryId &&
    other.snapshotId == snapshotId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backupFileName == null ? 0 : backupFileName!.hashCode) +
    (repositoryId.hashCode) +
    (snapshotId.hashCode);

  @override
  String toString() => 'ImmichRollbackRequestDto[backupFileName=$backupFileName, repositoryId=$repositoryId, snapshotId=$snapshotId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.backupFileName.isPresent) {
      final value = this.backupFileName.value;
      json[r'backupFileName'] = value;
    }
      json[r'repositoryId'] = this.repositoryId;
      json[r'snapshotId'] = this.snapshotId;
    return json;
  }

  /// Returns a new [ImmichRollbackRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImmichRollbackRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "ImmichRollbackRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImmichRollbackRequestDto(
        backupFileName: json.containsKey(r'backupFileName') ? Optional.present(mapValueOfType<String>(json, r'backupFileName')) : const Optional.absent(),
        repositoryId: mapValueOfType<String>(json, r'repositoryId')!,
        snapshotId: mapValueOfType<String>(json, r'snapshotId')!,
      );
    }
    return null;
  }

  static List<ImmichRollbackRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImmichRollbackRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImmichRollbackRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImmichRollbackRequestDto> mapFromJson(dynamic json) {
    final map = <String, ImmichRollbackRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImmichRollbackRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImmichRollbackRequestDto-objects as value to a dart map
  static Map<String, List<ImmichRollbackRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImmichRollbackRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImmichRollbackRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repositoryId',
    'snapshotId',
  };
}

