//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SnapshotDto {
  /// Returns a new [SnapshotDto] instance.
  SnapshotDto({
    required this.id,
    this.paths = const [],
    required this.time,
  });

  String id;

  List<String> paths;

  String time;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SnapshotDto &&
    other.id == id &&
    _deepEquality.equals(other.paths, paths) &&
    other.time == time;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (paths.hashCode) +
    (time.hashCode);

  @override
  String toString() => 'SnapshotDto[id=$id, paths=$paths, time=$time]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'paths'] = this.paths;
      json[r'time'] = this.time;
    return json;
  }

  /// Returns a new [SnapshotDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SnapshotDto? fromJson(dynamic value) {
    upgradeDto(value, "SnapshotDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SnapshotDto(
        id: mapValueOfType<String>(json, r'id')!,
        paths: json[r'paths'] is Iterable
            ? (json[r'paths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        time: mapValueOfType<String>(json, r'time')!,
      );
    }
    return null;
  }

  static List<SnapshotDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SnapshotDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SnapshotDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SnapshotDto> mapFromJson(dynamic json) {
    final map = <String, SnapshotDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SnapshotDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SnapshotDto-objects as value to a dart map
  static Map<String, List<SnapshotDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SnapshotDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SnapshotDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'paths',
    'time',
  };
}

