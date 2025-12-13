//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckExistingAssetsResponseDto {
  /// Returns a new [CheckExistingAssetsResponseDto] instance.
  CheckExistingAssetsResponseDto({
    this.existingIds = const [],
  });

  List<String> existingIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckExistingAssetsResponseDto &&
    _deepEquality.equals(other.existingIds, existingIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (existingIds.hashCode);

  @override
  String toString() => 'CheckExistingAssetsResponseDto[existingIds=$existingIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'existingIds'] = this.existingIds;
    return json;
  }

  /// Returns a new [CheckExistingAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckExistingAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "CheckExistingAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CheckExistingAssetsResponseDto(
        existingIds: json[r'existingIds'] is Iterable
            ? (json[r'existingIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<CheckExistingAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckExistingAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckExistingAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckExistingAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, CheckExistingAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckExistingAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckExistingAssetsResponseDto-objects as value to a dart map
  static Map<String, List<CheckExistingAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckExistingAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CheckExistingAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'existingIds',
  };
}

