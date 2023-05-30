//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditSharedLinkDto {
  /// Returns a new [EditSharedLinkDto] instance.
  EditSharedLinkDto({
    this.description,
    this.expiresAt,
    this.allowUpload,
    this.allowDownload,
    this.showExif,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  DateTime? expiresAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? allowUpload;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? allowDownload;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showExif;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditSharedLinkDto &&
     other.description == description &&
     other.expiresAt == expiresAt &&
     other.allowUpload == allowUpload &&
     other.allowDownload == allowDownload &&
     other.showExif == showExif;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (allowUpload == null ? 0 : allowUpload!.hashCode) +
    (allowDownload == null ? 0 : allowDownload!.hashCode) +
    (showExif == null ? 0 : showExif!.hashCode);

  @override
  String toString() => 'EditSharedLinkDto[description=$description, expiresAt=$expiresAt, allowUpload=$allowUpload, allowDownload=$allowDownload, showExif=$showExif]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
      // json[r'description'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
      // json[r'expiresAt'] = null;
    }
    if (this.allowUpload != null) {
      json[r'allowUpload'] = this.allowUpload;
    } else {
      // json[r'allowUpload'] = null;
    }
    if (this.allowDownload != null) {
      json[r'allowDownload'] = this.allowDownload;
    } else {
      // json[r'allowDownload'] = null;
    }
    if (this.showExif != null) {
      json[r'showExif'] = this.showExif;
    } else {
      // json[r'showExif'] = null;
    }
    return json;
  }

  /// Returns a new [EditSharedLinkDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditSharedLinkDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "EditSharedLinkDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "EditSharedLinkDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return EditSharedLinkDto(
        description: mapValueOfType<String>(json, r'description'),
        expiresAt: mapDateTime(json, r'expiresAt', ''),
        allowUpload: mapValueOfType<bool>(json, r'allowUpload'),
        allowDownload: mapValueOfType<bool>(json, r'allowDownload'),
        showExif: mapValueOfType<bool>(json, r'showExif'),
      );
    }
    return null;
  }

  static List<EditSharedLinkDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditSharedLinkDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditSharedLinkDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditSharedLinkDto> mapFromJson(dynamic json) {
    final map = <String, EditSharedLinkDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditSharedLinkDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditSharedLinkDto-objects as value to a dart map
  static Map<String, List<EditSharedLinkDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditSharedLinkDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditSharedLinkDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

