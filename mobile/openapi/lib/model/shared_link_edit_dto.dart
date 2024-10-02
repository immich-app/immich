//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkEditDto {
  /// Returns a new [SharedLinkEditDto] instance.
  SharedLinkEditDto({
    this.allowDownload,
    this.allowUpload,
    this.changeExpiryTime,
    this.description,
    this.expiresAt,
    this.password,
    this.showMetadata,
  });

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
  bool? allowUpload;

  /// Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? changeExpiryTime;

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
  String? password;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showMetadata;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkEditDto &&
    other.allowDownload == allowDownload &&
    other.allowUpload == allowUpload &&
    other.changeExpiryTime == changeExpiryTime &&
    other.description == description &&
    other.expiresAt == expiresAt &&
    other.password == password &&
    other.showMetadata == showMetadata;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (allowDownload == null ? 0 : allowDownload!.hashCode) +
    (allowUpload == null ? 0 : allowUpload!.hashCode) +
    (changeExpiryTime == null ? 0 : changeExpiryTime!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (showMetadata == null ? 0 : showMetadata!.hashCode);

  @override
  String toString() => 'SharedLinkEditDto[allowDownload=$allowDownload, allowUpload=$allowUpload, changeExpiryTime=$changeExpiryTime, description=$description, expiresAt=$expiresAt, password=$password, showMetadata=$showMetadata]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.allowDownload != null) {
      json[r'allowDownload'] = this.allowDownload;
    } else {
    //  json[r'allowDownload'] = null;
    }
    if (this.allowUpload != null) {
      json[r'allowUpload'] = this.allowUpload;
    } else {
    //  json[r'allowUpload'] = null;
    }
    if (this.changeExpiryTime != null) {
      json[r'changeExpiryTime'] = this.changeExpiryTime;
    } else {
    //  json[r'changeExpiryTime'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
    //  json[r'expiresAt'] = null;
    }
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    if (this.showMetadata != null) {
      json[r'showMetadata'] = this.showMetadata;
    } else {
    //  json[r'showMetadata'] = null;
    }
    return json;
  }

  /// Returns a new [SharedLinkEditDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkEditDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedLinkEditDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkEditDto(
        allowDownload: mapValueOfType<bool>(json, r'allowDownload'),
        allowUpload: mapValueOfType<bool>(json, r'allowUpload'),
        changeExpiryTime: mapValueOfType<bool>(json, r'changeExpiryTime'),
        description: mapValueOfType<String>(json, r'description'),
        expiresAt: mapDateTime(json, r'expiresAt', r''),
        password: mapValueOfType<String>(json, r'password'),
        showMetadata: mapValueOfType<bool>(json, r'showMetadata'),
      );
    }
    return null;
  }

  static List<SharedLinkEditDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkEditDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkEditDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinkEditDto> mapFromJson(dynamic json) {
    final map = <String, SharedLinkEditDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinkEditDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinkEditDto-objects as value to a dart map
  static Map<String, List<SharedLinkEditDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinkEditDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinkEditDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

