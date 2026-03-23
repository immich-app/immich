//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceLinkedLibraryDto {
  /// Returns a new [SharedSpaceLinkedLibraryDto] instance.
  SharedSpaceLinkedLibraryDto({
    this.addedById,
    required this.createdAt,
    required this.libraryId,
    required this.libraryName,
  });

  String? addedById;

  DateTime createdAt;

  String libraryId;

  String libraryName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceLinkedLibraryDto &&
    other.addedById == addedById &&
    other.createdAt == createdAt &&
    other.libraryId == libraryId &&
    other.libraryName == libraryName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (addedById == null ? 0 : addedById!.hashCode) +
    (createdAt.hashCode) +
    (libraryId.hashCode) +
    (libraryName.hashCode);

  @override
  String toString() => 'SharedSpaceLinkedLibraryDto[addedById=$addedById, createdAt=$createdAt, libraryId=$libraryId, libraryName=$libraryName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.addedById != null) {
      json[r'addedById'] = this.addedById;
    } else {
    //  json[r'addedById'] = null;
    }
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'libraryId'] = this.libraryId;
      json[r'libraryName'] = this.libraryName;
    return json;
  }

  /// Returns a new [SharedSpaceLinkedLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceLinkedLibraryDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceLinkedLibraryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceLinkedLibraryDto(
        addedById: mapValueOfType<String>(json, r'addedById'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        libraryId: mapValueOfType<String>(json, r'libraryId')!,
        libraryName: mapValueOfType<String>(json, r'libraryName')!,
      );
    }
    return null;
  }

  static List<SharedSpaceLinkedLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceLinkedLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceLinkedLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceLinkedLibraryDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceLinkedLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceLinkedLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceLinkedLibraryDto-objects as value to a dart map
  static Map<String, List<SharedSpaceLinkedLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceLinkedLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceLinkedLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'libraryId',
    'libraryName',
  };
}

