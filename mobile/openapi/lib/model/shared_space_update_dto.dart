//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceUpdateDto {
  /// Returns a new [SharedSpaceUpdateDto] instance.
  SharedSpaceUpdateDto({
    this.color,
    this.description,
    this.faceRecognitionEnabled,
    this.name,
    this.petsEnabled,
    this.thumbnailAssetId,
    this.thumbnailCropY,
  });

  /// Space color
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserAvatarColor? color;

  /// Space description
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  /// Enable face recognition for this space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? faceRecognitionEnabled;

  /// Space name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Show pets in space people list
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? petsEnabled;

  /// Thumbnail asset ID
  String? thumbnailAssetId;

  /// Vertical crop position for cover photo (0-100)
  ///
  /// Minimum value: 0
  /// Maximum value: 100
  int? thumbnailCropY;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceUpdateDto &&
    other.color == color &&
    other.description == description &&
    other.faceRecognitionEnabled == faceRecognitionEnabled &&
    other.name == name &&
    other.petsEnabled == petsEnabled &&
    other.thumbnailAssetId == thumbnailAssetId &&
    other.thumbnailCropY == thumbnailCropY;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (faceRecognitionEnabled == null ? 0 : faceRecognitionEnabled!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (petsEnabled == null ? 0 : petsEnabled!.hashCode) +
    (thumbnailAssetId == null ? 0 : thumbnailAssetId!.hashCode) +
    (thumbnailCropY == null ? 0 : thumbnailCropY!.hashCode);

  @override
  String toString() => 'SharedSpaceUpdateDto[color=$color, description=$description, faceRecognitionEnabled=$faceRecognitionEnabled, name=$name, petsEnabled=$petsEnabled, thumbnailAssetId=$thumbnailAssetId, thumbnailCropY=$thumbnailCropY]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.faceRecognitionEnabled != null) {
      json[r'faceRecognitionEnabled'] = this.faceRecognitionEnabled;
    } else {
    //  json[r'faceRecognitionEnabled'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.petsEnabled != null) {
      json[r'petsEnabled'] = this.petsEnabled;
    } else {
    //  json[r'petsEnabled'] = null;
    }
    if (this.thumbnailAssetId != null) {
      json[r'thumbnailAssetId'] = this.thumbnailAssetId;
    } else {
    //  json[r'thumbnailAssetId'] = null;
    }
    if (this.thumbnailCropY != null) {
      json[r'thumbnailCropY'] = this.thumbnailCropY;
    } else {
    //  json[r'thumbnailCropY'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpaceUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceUpdateDto(
        color: UserAvatarColor.fromJson(json[r'color']),
        description: mapValueOfType<String>(json, r'description'),
        faceRecognitionEnabled: mapValueOfType<bool>(json, r'faceRecognitionEnabled'),
        name: mapValueOfType<String>(json, r'name'),
        petsEnabled: mapValueOfType<bool>(json, r'petsEnabled'),
        thumbnailAssetId: mapValueOfType<String>(json, r'thumbnailAssetId'),
        thumbnailCropY: mapValueOfType<int>(json, r'thumbnailCropY'),
      );
    }
    return null;
  }

  static List<SharedSpaceUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceUpdateDto-objects as value to a dart map
  static Map<String, List<SharedSpaceUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

