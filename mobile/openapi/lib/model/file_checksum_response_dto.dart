//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FileChecksumResponseDto {
  /// Returns a new [FileChecksumResponseDto] instance.
  FileChecksumResponseDto({
    required this.checksum,
    required this.filename,
  });

  String checksum;

  String filename;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FileChecksumResponseDto &&
    other.checksum == checksum &&
    other.filename == filename;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (filename.hashCode);

  @override
  String toString() => 'FileChecksumResponseDto[checksum=$checksum, filename=$filename]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'filename'] = this.filename;
    return json;
  }

  /// Returns a new [FileChecksumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FileChecksumResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "FileChecksumResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FileChecksumResponseDto(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        filename: mapValueOfType<String>(json, r'filename')!,
      );
    }
    return null;
  }

  static List<FileChecksumResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FileChecksumResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FileChecksumResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FileChecksumResponseDto> mapFromJson(dynamic json) {
    final map = <String, FileChecksumResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FileChecksumResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FileChecksumResponseDto-objects as value to a dart map
  static Map<String, List<FileChecksumResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FileChecksumResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FileChecksumResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'filename',
  };
}

