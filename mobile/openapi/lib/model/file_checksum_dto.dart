//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FileChecksumDto {
  /// Returns a new [FileChecksumDto] instance.
  FileChecksumDto({
    this.filenames = const [],
  });

  List<String> filenames;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FileChecksumDto &&
    _deepEquality.equals(other.filenames, filenames);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (filenames.hashCode);

  @override
  String toString() => 'FileChecksumDto[filenames=$filenames]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'filenames'] = this.filenames;
    return json;
  }

  /// Returns a new [FileChecksumDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FileChecksumDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FileChecksumDto(
        filenames: json[r'filenames'] is Iterable
            ? (json[r'filenames'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<FileChecksumDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FileChecksumDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FileChecksumDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FileChecksumDto> mapFromJson(dynamic json) {
    final map = <String, FileChecksumDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FileChecksumDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FileChecksumDto-objects as value to a dart map
  static Map<String, List<FileChecksumDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FileChecksumDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FileChecksumDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'filenames',
  };
}

