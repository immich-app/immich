//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncStreamResponseDto {
  /// Returns a new [SyncStreamResponseDto] instance.
  SyncStreamResponseDto({
    required this.action,
    required this.data,
    required this.type,
  });

  SyncAction action;

  SyncStreamResponseDtoData data;

  SyncType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncStreamResponseDto &&
    other.action == action &&
    other.data == data &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (data.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'SyncStreamResponseDto[action=$action, data=$data, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'data'] = this.data;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [SyncStreamResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncStreamResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SyncStreamResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncStreamResponseDto(
        action: SyncAction.fromJson(json[r'action'])!,
        data: SyncStreamResponseDtoData.fromJson(json[r'data'])!,
        type: SyncType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<SyncStreamResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStreamResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStreamResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncStreamResponseDto> mapFromJson(dynamic json) {
    final map = <String, SyncStreamResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncStreamResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncStreamResponseDto-objects as value to a dart map
  static Map<String, List<SyncStreamResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncStreamResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncStreamResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'data',
    'type',
  };
}

