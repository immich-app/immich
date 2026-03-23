//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceLibraryLinkDto {
  /// Returns a new [SharedSpaceLibraryLinkDto] instance.
  SharedSpaceLibraryLinkDto({
    required this.libraryId,
  });

  /// Library ID
  String libraryId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceLibraryLinkDto &&
    other.libraryId == libraryId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (libraryId.hashCode);

  @override
  String toString() => 'SharedSpaceLibraryLinkDto[libraryId=$libraryId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'libraryId'] = this.libraryId;
    return json;
  }

  /// Returns a new [SharedSpaceLibraryLinkDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceLibraryLinkDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceLibraryLinkDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceLibraryLinkDto(
        libraryId: mapValueOfType<String>(json, r'libraryId')!,
      );
    }
    return null;
  }

  static List<SharedSpaceLibraryLinkDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceLibraryLinkDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceLibraryLinkDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceLibraryLinkDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceLibraryLinkDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceLibraryLinkDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceLibraryLinkDto-objects as value to a dart map
  static Map<String, List<SharedSpaceLibraryLinkDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceLibraryLinkDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceLibraryLinkDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'libraryId',
  };
}

