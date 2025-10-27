//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityAlbumUpdateResponseDto {
  /// Returns a new [ActivityAlbumUpdateResponseDto] instance.
  ActivityAlbumUpdateResponseDto({
    required this.aggregationId,
    this.assetIds = const [],
    required this.totalAssets,
  });

  String aggregationId;

  List<String> assetIds;

  int totalAssets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityAlbumUpdateResponseDto &&
    other.aggregationId == aggregationId &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.totalAssets == totalAssets;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (aggregationId.hashCode) +
    (assetIds.hashCode) +
    (totalAssets.hashCode);

  @override
  String toString() => 'ActivityAlbumUpdateResponseDto[aggregationId=$aggregationId, assetIds=$assetIds, totalAssets=$totalAssets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'aggregationId'] = this.aggregationId;
      json[r'assetIds'] = this.assetIds;
      json[r'totalAssets'] = this.totalAssets;
    return json;
  }

  /// Returns a new [ActivityAlbumUpdateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityAlbumUpdateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ActivityAlbumUpdateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityAlbumUpdateResponseDto(
        aggregationId: mapValueOfType<String>(json, r'aggregationId')!,
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        totalAssets: mapValueOfType<int>(json, r'totalAssets')!,
      );
    }
    return null;
  }

  static List<ActivityAlbumUpdateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityAlbumUpdateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityAlbumUpdateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityAlbumUpdateResponseDto> mapFromJson(dynamic json) {
    final map = <String, ActivityAlbumUpdateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityAlbumUpdateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityAlbumUpdateResponseDto-objects as value to a dart map
  static Map<String, List<ActivityAlbumUpdateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityAlbumUpdateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityAlbumUpdateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'aggregationId',
    'assetIds',
    'totalAssets',
  };
}

