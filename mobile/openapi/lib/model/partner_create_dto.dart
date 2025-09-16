//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PartnerCreateDto {
  /// Returns a new [PartnerCreateDto] instance.
  PartnerCreateDto({
    required this.sharedWithId,
  });

  String sharedWithId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartnerCreateDto &&
    other.sharedWithId == sharedWithId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sharedWithId.hashCode);

  @override
  String toString() => 'PartnerCreateDto[sharedWithId=$sharedWithId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sharedWithId'] = this.sharedWithId;
    return json;
  }

  /// Returns a new [PartnerCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartnerCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "PartnerCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartnerCreateDto(
        sharedWithId: mapValueOfType<String>(json, r'sharedWithId')!,
      );
    }
    return null;
  }

  static List<PartnerCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartnerCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartnerCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PartnerCreateDto> mapFromJson(dynamic json) {
    final map = <String, PartnerCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PartnerCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PartnerCreateDto-objects as value to a dart map
  static Map<String, List<PartnerCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PartnerCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PartnerCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sharedWithId',
  };
}

