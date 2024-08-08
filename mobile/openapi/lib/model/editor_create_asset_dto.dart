//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorCreateAssetDto {
  /// Returns a new [EditorCreateAssetDto] instance.
  EditorCreateAssetDto({
    this.edits = const [],
    required this.id,
    this.stack,
  });

  /// list of edits
  List<EditorCreateAssetDtoEditsInner> edits;

  /// Source asset id
  String id;

  /// Stack the edit and the original
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? stack;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorCreateAssetDto &&
    _deepEquality.equals(other.edits, edits) &&
    other.id == id &&
    other.stack == stack;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (edits.hashCode) +
    (id.hashCode) +
    (stack == null ? 0 : stack!.hashCode);

  @override
  String toString() => 'EditorCreateAssetDto[edits=$edits, id=$id, stack=$stack]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'edits'] = this.edits;
      json[r'id'] = this.id;
    if (this.stack != null) {
      json[r'stack'] = this.stack;
    } else {
    //  json[r'stack'] = null;
    }
    return json;
  }

  /// Returns a new [EditorCreateAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorCreateAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorCreateAssetDto(
        edits: EditorCreateAssetDtoEditsInner.listFromJson(json[r'edits']),
        id: mapValueOfType<String>(json, r'id')!,
        stack: mapValueOfType<bool>(json, r'stack'),
      );
    }
    return null;
  }

  static List<EditorCreateAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorCreateAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorCreateAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorCreateAssetDto> mapFromJson(dynamic json) {
    final map = <String, EditorCreateAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorCreateAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorCreateAssetDto-objects as value to a dart map
  static Map<String, List<EditorCreateAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorCreateAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorCreateAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'edits',
    'id',
  };
}

