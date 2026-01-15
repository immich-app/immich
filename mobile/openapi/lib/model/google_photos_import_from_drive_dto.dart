//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GooglePhotosImportFromDriveDto {
  /// Returns a new [GooglePhotosImportFromDriveDto] instance.
  GooglePhotosImportFromDriveDto({
    this.fileIds = const [],
  });

  /// Array of Google Drive file IDs to import
  List<String> fileIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GooglePhotosImportFromDriveDto &&
    _deepEquality.equals(other.fileIds, fileIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (fileIds.hashCode);

  @override
  String toString() => 'GooglePhotosImportFromDriveDto[fileIds=$fileIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'fileIds'] = this.fileIds;
    return json;
  }

  /// Returns a new [GooglePhotosImportFromDriveDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GooglePhotosImportFromDriveDto? fromJson(dynamic value) {
    upgradeDto(value, "GooglePhotosImportFromDriveDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GooglePhotosImportFromDriveDto(
        fileIds: json[r'fileIds'] is Iterable
            ? (json[r'fileIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<GooglePhotosImportFromDriveDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GooglePhotosImportFromDriveDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GooglePhotosImportFromDriveDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GooglePhotosImportFromDriveDto> mapFromJson(dynamic json) {
    final map = <String, GooglePhotosImportFromDriveDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GooglePhotosImportFromDriveDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GooglePhotosImportFromDriveDto-objects as value to a dart map
  static Map<String, List<GooglePhotosImportFromDriveDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GooglePhotosImportFromDriveDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GooglePhotosImportFromDriveDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'fileIds',
  };
}

