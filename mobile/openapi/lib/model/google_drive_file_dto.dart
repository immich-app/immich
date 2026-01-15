//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GoogleDriveFileDto {
  /// Returns a new [GoogleDriveFileDto] instance.
  GoogleDriveFileDto({
    required this.createdTime,
    required this.id,
    required this.mimeType,
    required this.name,
    required this.size,
  });

  /// Creation timestamp
  String createdTime;

  /// Google Drive file ID
  String id;

  /// MIME type
  String mimeType;

  /// File name
  String name;

  /// File size in bytes
  num size;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GoogleDriveFileDto &&
    other.createdTime == createdTime &&
    other.id == id &&
    other.mimeType == mimeType &&
    other.name == name &&
    other.size == size;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdTime.hashCode) +
    (id.hashCode) +
    (mimeType.hashCode) +
    (name.hashCode) +
    (size.hashCode);

  @override
  String toString() => 'GoogleDriveFileDto[createdTime=$createdTime, id=$id, mimeType=$mimeType, name=$name, size=$size]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdTime'] = this.createdTime;
      json[r'id'] = this.id;
      json[r'mimeType'] = this.mimeType;
      json[r'name'] = this.name;
      json[r'size'] = this.size;
    return json;
  }

  /// Returns a new [GoogleDriveFileDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GoogleDriveFileDto? fromJson(dynamic value) {
    upgradeDto(value, "GoogleDriveFileDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GoogleDriveFileDto(
        createdTime: mapValueOfType<String>(json, r'createdTime')!,
        id: mapValueOfType<String>(json, r'id')!,
        mimeType: mapValueOfType<String>(json, r'mimeType')!,
        name: mapValueOfType<String>(json, r'name')!,
        size: num.parse('${json[r'size']}'),
      );
    }
    return null;
  }

  static List<GoogleDriveFileDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GoogleDriveFileDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GoogleDriveFileDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GoogleDriveFileDto> mapFromJson(dynamic json) {
    final map = <String, GoogleDriveFileDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GoogleDriveFileDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GoogleDriveFileDto-objects as value to a dart map
  static Map<String, List<GoogleDriveFileDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GoogleDriveFileDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GoogleDriveFileDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdTime',
    'id',
    'mimeType',
    'name',
    'size',
  };
}

