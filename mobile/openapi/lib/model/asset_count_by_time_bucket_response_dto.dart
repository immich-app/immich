//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCountByTimeBucketResponseDto {
  /// Returns a new [AssetCountByTimeBucketResponseDto] instance.
  AssetCountByTimeBucketResponseDto({
    this.buckets = const [],
    required this.totalCount,
  });

  List<AssetCountByTimeBucket> buckets;

  int totalCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCountByTimeBucketResponseDto &&
     other.buckets == buckets &&
     other.totalCount == totalCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (buckets.hashCode) +
    (totalCount.hashCode);

  @override
  String toString() => 'AssetCountByTimeBucketResponseDto[buckets=$buckets, totalCount=$totalCount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'buckets'] = this.buckets;
      json[r'totalCount'] = this.totalCount;
    return json;
  }

  /// Returns a new [AssetCountByTimeBucketResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCountByTimeBucketResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetCountByTimeBucketResponseDto(
        buckets: AssetCountByTimeBucket.listFromJson(json[r'buckets']),
        totalCount: mapValueOfType<int>(json, r'totalCount')!,
      );
    }
    return null;
  }

  static List<AssetCountByTimeBucketResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCountByTimeBucketResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCountByTimeBucketResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCountByTimeBucketResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetCountByTimeBucketResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByTimeBucketResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCountByTimeBucketResponseDto-objects as value to a dart map
  static Map<String, List<AssetCountByTimeBucketResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCountByTimeBucketResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetCountByTimeBucketResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'buckets',
    'totalCount',
  };
}

