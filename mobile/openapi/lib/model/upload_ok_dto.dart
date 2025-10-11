//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UploadOkDto {
  /// Returns a new [UploadOkDto] instance.
  UploadOkDto({
    required this.id,
  });

  String id;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UploadOkDto &&
    other.id == id;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode);

  @override
  String toString() => 'UploadOkDto[id=$id]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
    return json;
  }

  /// Returns a new [UploadOkDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UploadOkDto? fromJson(dynamic value) {
    upgradeDto(value, "UploadOkDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UploadOkDto(
        id: mapValueOfType<String>(json, r'id')!,
      );
    }
    return null;
  }

  static List<UploadOkDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UploadOkDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UploadOkDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UploadOkDto> mapFromJson(dynamic json) {
    final map = <String, UploadOkDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UploadOkDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UploadOkDto-objects as value to a dart map
  static Map<String, List<UploadOkDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UploadOkDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UploadOkDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
  };
}

