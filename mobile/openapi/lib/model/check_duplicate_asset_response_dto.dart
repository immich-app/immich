//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckDuplicateAssetResponseDto {
  /// Returns a new [CheckDuplicateAssetResponseDto] instance.
  CheckDuplicateAssetResponseDto({
    this.id,
    required this.isExist,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? id;

  bool isExist;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckDuplicateAssetResponseDto &&
     other.id == id &&
     other.isExist == isExist;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id == null ? 0 : id!.hashCode) +
    (isExist.hashCode);

  @override
  String toString() => 'CheckDuplicateAssetResponseDto[id=$id, isExist=$isExist]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.id != null) {
      json[r'id'] = this.id;
    } else {
    //  json[r'id'] = null;
    }
      json[r'isExist'] = this.isExist;
    return json;
  }

  /// Returns a new [CheckDuplicateAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckDuplicateAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CheckDuplicateAssetResponseDto(
        id: mapValueOfType<String>(json, r'id'),
        isExist: mapValueOfType<bool>(json, r'isExist')!,
      );
    }
    return null;
  }

  static List<CheckDuplicateAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckDuplicateAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckDuplicateAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckDuplicateAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, CheckDuplicateAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckDuplicateAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckDuplicateAssetResponseDto-objects as value to a dart map
  static Map<String, List<CheckDuplicateAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckDuplicateAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CheckDuplicateAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isExist',
  };
}

