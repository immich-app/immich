//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FileReportFixDto {
  /// Returns a new [FileReportFixDto] instance.
  FileReportFixDto({
    this.items = const [],
  });

  List<FileReportItemDto> items;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FileReportFixDto &&
    _deepEquality.equals(other.items, items);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (items.hashCode);

  @override
  String toString() => 'FileReportFixDto[items=$items]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'items'] = this.items;
    return json;
  }

  /// Returns a new [FileReportFixDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FileReportFixDto? fromJson(dynamic value) {
    upgradeDto(value, "FileReportFixDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FileReportFixDto(
        items: FileReportItemDto.listFromJson(json[r'items']),
      );
    }
    return null;
  }

  static List<FileReportFixDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FileReportFixDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FileReportFixDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FileReportFixDto> mapFromJson(dynamic json) {
    final map = <String, FileReportFixDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FileReportFixDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FileReportFixDto-objects as value to a dart map
  static Map<String, List<FileReportFixDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FileReportFixDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FileReportFixDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'items',
  };
}

