//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositorySnapshotRestoreRequestDto {
  /// Returns a new [RepositorySnapshotRestoreRequestDto] instance.
  RepositorySnapshotRestoreRequestDto({
    this.include = const Optional.present(const []),
    this.target = const Optional.absent(),
  });

  Optional<List<String>?> include;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> target;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositorySnapshotRestoreRequestDto &&
    _deepEquality.equals(other.include, include) &&
    other.target == target;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (include.hashCode) +
    (target == null ? 0 : target!.hashCode);

  @override
  String toString() => 'RepositorySnapshotRestoreRequestDto[include=$include, target=$target]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.include.isPresent) {
      final value = this.include.value;
      json[r'include'] = value;
    }
    if (this.target.isPresent) {
      final value = this.target.value;
      json[r'target'] = value;
    }
    return json;
  }

  /// Returns a new [RepositorySnapshotRestoreRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositorySnapshotRestoreRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositorySnapshotRestoreRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositorySnapshotRestoreRequestDto(
        include: json.containsKey(r'include') ? Optional.present(json[r'include'] is Iterable
            ? (json[r'include'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        target: json.containsKey(r'target') ? Optional.present(mapValueOfType<String>(json, r'target')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<RepositorySnapshotRestoreRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositorySnapshotRestoreRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositorySnapshotRestoreRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositorySnapshotRestoreRequestDto> mapFromJson(dynamic json) {
    final map = <String, RepositorySnapshotRestoreRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositorySnapshotRestoreRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositorySnapshotRestoreRequestDto-objects as value to a dart map
  static Map<String, List<RepositorySnapshotRestoreRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositorySnapshotRestoreRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositorySnapshotRestoreRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

