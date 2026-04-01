//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharingOptionsResponseDto {
  /// Returns a new [SharingOptionsResponseDto] instance.
  SharingOptionsResponseDto({
    required this.inTimeline,
    this.permissions = const [],
  });

  bool inTimeline;

  List<SharingPermission> permissions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharingOptionsResponseDto &&
    other.inTimeline == inTimeline &&
    _deepEquality.equals(other.permissions, permissions);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (inTimeline.hashCode) +
    (permissions.hashCode);

  @override
  String toString() => 'SharingOptionsResponseDto[inTimeline=$inTimeline, permissions=$permissions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'inTimeline'] = this.inTimeline;
      json[r'permissions'] = this.permissions;
    return json;
  }

  /// Returns a new [SharingOptionsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharingOptionsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharingOptionsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharingOptionsResponseDto(
        inTimeline: mapValueOfType<bool>(json, r'inTimeline')!,
        permissions: SharingPermission.listFromJson(json[r'permissions']),
      );
    }
    return null;
  }

  static List<SharingOptionsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharingOptionsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharingOptionsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharingOptionsResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharingOptionsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharingOptionsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharingOptionsResponseDto-objects as value to a dart map
  static Map<String, List<SharingOptionsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharingOptionsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharingOptionsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'inTimeline',
    'permissions',
  };
}

