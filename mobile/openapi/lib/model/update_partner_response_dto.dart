//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdatePartnerResponseDto {
  /// Returns a new [UpdatePartnerResponseDto] instance.
  UpdatePartnerResponseDto({
    required this.inTimeline,
  });

  bool inTimeline;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdatePartnerResponseDto &&
     other.inTimeline == inTimeline;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (inTimeline.hashCode);

  @override
  String toString() => 'UpdatePartnerResponseDto[inTimeline=$inTimeline]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'inTimeline'] = this.inTimeline;
    return json;
  }

  /// Returns a new [UpdatePartnerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdatePartnerResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdatePartnerResponseDto(
        inTimeline: mapValueOfType<bool>(json, r'inTimeline')!,
      );
    }
    return null;
  }

  static List<UpdatePartnerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdatePartnerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdatePartnerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdatePartnerResponseDto> mapFromJson(dynamic json) {
    final map = <String, UpdatePartnerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdatePartnerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdatePartnerResponseDto-objects as value to a dart map
  static Map<String, List<UpdatePartnerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdatePartnerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdatePartnerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'inTimeline',
  };
}

