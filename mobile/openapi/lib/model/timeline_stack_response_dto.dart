//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TimelineStackResponseDto {
  /// Returns a new [TimelineStackResponseDto] instance.
  TimelineStackResponseDto({
    required this.assetCount,
    required this.id,
    required this.primaryAssetId,
  });

  num assetCount;

  String id;

  String primaryAssetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TimelineStackResponseDto &&
    other.assetCount == assetCount &&
    other.id == id &&
    other.primaryAssetId == primaryAssetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetCount.hashCode) +
    (id.hashCode) +
    (primaryAssetId.hashCode);

  @override
  String toString() => 'TimelineStackResponseDto[assetCount=$assetCount, id=$id, primaryAssetId=$primaryAssetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetCount'] = this.assetCount;
      json[r'id'] = this.id;
      json[r'primaryAssetId'] = this.primaryAssetId;
    return json;
  }

  /// Returns a new [TimelineStackResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TimelineStackResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TimelineStackResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TimelineStackResponseDto(
        assetCount: num.parse('${json[r'assetCount']}'),
        id: mapValueOfType<String>(json, r'id')!,
        primaryAssetId: mapValueOfType<String>(json, r'primaryAssetId')!,
      );
    }
    return null;
  }

  static List<TimelineStackResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TimelineStackResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TimelineStackResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TimelineStackResponseDto> mapFromJson(dynamic json) {
    final map = <String, TimelineStackResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TimelineStackResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TimelineStackResponseDto-objects as value to a dart map
  static Map<String, List<TimelineStackResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TimelineStackResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TimelineStackResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetCount',
    'id',
    'primaryAssetId',
  };
}

