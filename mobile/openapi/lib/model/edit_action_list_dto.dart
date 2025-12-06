//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditActionListDto {
  /// Returns a new [EditActionListDto] instance.
  EditActionListDto({
    this.edits = const [],
  });

  /// list of edits
  List<AssetEditsDtoEditsInner> edits;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditActionListDto &&
    _deepEquality.equals(other.edits, edits);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (edits.hashCode);

  @override
  String toString() => 'EditActionListDto[edits=$edits]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'edits'] = this.edits;
    return json;
  }

  /// Returns a new [EditActionListDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditActionListDto? fromJson(dynamic value) {
    upgradeDto(value, "EditActionListDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditActionListDto(
        edits: AssetEditsDtoEditsInner.listFromJson(json[r'edits']),
      );
    }
    return null;
  }

  static List<EditActionListDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditActionListDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditActionListDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditActionListDto> mapFromJson(dynamic json) {
    final map = <String, EditActionListDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditActionListDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditActionListDto-objects as value to a dart map
  static Map<String, List<EditActionListDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditActionListDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditActionListDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'edits',
  };
}

