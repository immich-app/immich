//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAssetDto {
  /// Returns a new [UpdateAssetDto] instance.
  UpdateAssetDto({
    this.tagIds = const [],
    this.isFavorite,
    this.isArchived,
    this.description,
  });

  List<String> tagIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isArchived;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAssetDto &&
     other.tagIds == tagIds &&
     other.isFavorite == isFavorite &&
     other.isArchived == isArchived &&
     other.description == description;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (tagIds.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (description == null ? 0 : description!.hashCode);

  @override
  String toString() => 'UpdateAssetDto[tagIds=$tagIds, isFavorite=$isFavorite, isArchived=$isArchived, description=$description]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'tagIds'] = this.tagIds;
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
      // json[r'isFavorite'] = null;
    }
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
      // json[r'isArchived'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
      // json[r'description'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateAssetDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateAssetDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateAssetDto(
        tagIds: json[r'tagIds'] is List
            ? (json[r'tagIds'] as List).cast<String>()
            : const [],
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        description: mapValueOfType<String>(json, r'description'),
      );
    }
    return null;
  }

  static List<UpdateAssetDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAssetDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAssetDto-objects as value to a dart map
  static Map<String, List<UpdateAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

