//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ResolveDuplicatesDto {
  /// Returns a new [ResolveDuplicatesDto] instance.
  ResolveDuplicatesDto({
    this.assetIds = const [],
    required this.duplicateId,
  });

  List<String> assetIds;

  String duplicateId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ResolveDuplicatesDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.duplicateId == duplicateId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (duplicateId.hashCode);

  @override
  String toString() => 'ResolveDuplicatesDto[assetIds=$assetIds, duplicateId=$duplicateId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'duplicateId'] = this.duplicateId;
    return json;
  }

  /// Returns a new [ResolveDuplicatesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ResolveDuplicatesDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ResolveDuplicatesDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
      );
    }
    return null;
  }

  static List<ResolveDuplicatesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ResolveDuplicatesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ResolveDuplicatesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ResolveDuplicatesDto> mapFromJson(dynamic json) {
    final map = <String, ResolveDuplicatesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ResolveDuplicatesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ResolveDuplicatesDto-objects as value to a dart map
  static Map<String, List<ResolveDuplicatesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ResolveDuplicatesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ResolveDuplicatesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
    'duplicateId',
  };
}

