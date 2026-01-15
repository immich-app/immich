//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GoogleDriveFilesResponseDto {
  /// Returns a new [GoogleDriveFilesResponseDto] instance.
  GoogleDriveFilesResponseDto({
    this.files = const [],
  });

  List<GoogleDriveFileDto> files;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GoogleDriveFilesResponseDto &&
    _deepEquality.equals(other.files, files);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (files.hashCode);

  @override
  String toString() => 'GoogleDriveFilesResponseDto[files=$files]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'files'] = this.files;
    return json;
  }

  /// Returns a new [GoogleDriveFilesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GoogleDriveFilesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "GoogleDriveFilesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GoogleDriveFilesResponseDto(
        files: GoogleDriveFileDto.listFromJson(json[r'files']),
      );
    }
    return null;
  }

  static List<GoogleDriveFilesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GoogleDriveFilesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GoogleDriveFilesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GoogleDriveFilesResponseDto> mapFromJson(dynamic json) {
    final map = <String, GoogleDriveFilesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GoogleDriveFilesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GoogleDriveFilesResponseDto-objects as value to a dart map
  static Map<String, List<GoogleDriveFilesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GoogleDriveFilesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GoogleDriveFilesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'files',
  };
}

