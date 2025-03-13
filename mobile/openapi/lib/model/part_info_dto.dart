//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PartInfoDto {
  /// Returns a new [PartInfoDto] instance.
  PartInfoDto({
    required this.part_,
    required this.size,
  });

  int part_;

  int size;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartInfoDto &&
    other.part_ == part_ &&
    other.size == size;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (part_.hashCode) +
    (size.hashCode);

  @override
  String toString() => 'PartInfoDto[part_=$part_, size=$size]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'part'] = this.part_;
      json[r'size'] = this.size;
    return json;
  }

  /// Returns a new [PartInfoDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartInfoDto? fromJson(dynamic value) {
    upgradeDto(value, "PartInfoDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartInfoDto(
        part_: mapValueOfType<int>(json, r'part')!,
        size: mapValueOfType<int>(json, r'size')!,
      );
    }
    return null;
  }

  static List<PartInfoDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartInfoDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartInfoDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PartInfoDto> mapFromJson(dynamic json) {
    final map = <String, PartInfoDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PartInfoDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PartInfoDto-objects as value to a dart map
  static Map<String, List<PartInfoDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PartInfoDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PartInfoDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'part',
    'size',
  };
}

