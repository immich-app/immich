//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateStackParentDto {
  /// Returns a new [UpdateStackParentDto] instance.
  UpdateStackParentDto({
    required this.newParentId,
    required this.oldParentId,
  });

  String newParentId;

  String oldParentId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateStackParentDto &&
    other.newParentId == newParentId &&
    other.oldParentId == oldParentId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (newParentId.hashCode) +
    (oldParentId.hashCode);

  @override
  String toString() => 'UpdateStackParentDto[newParentId=$newParentId, oldParentId=$oldParentId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'newParentId'] = this.newParentId;
      json[r'oldParentId'] = this.oldParentId;
    return json;
  }

  /// Returns a new [UpdateStackParentDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateStackParentDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateStackParentDto(
        newParentId: mapValueOfType<String>(json, r'newParentId')!,
        oldParentId: mapValueOfType<String>(json, r'oldParentId')!,
      );
    }
    return null;
  }

  static List<UpdateStackParentDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateStackParentDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateStackParentDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateStackParentDto> mapFromJson(dynamic json) {
    final map = <String, UpdateStackParentDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateStackParentDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateStackParentDto-objects as value to a dart map
  static Map<String, List<UpdateStackParentDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateStackParentDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateStackParentDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'newParentId',
    'oldParentId',
  };
}

