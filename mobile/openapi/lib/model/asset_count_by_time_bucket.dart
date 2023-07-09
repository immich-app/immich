//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCountByTimeBucket {
  /// Returns a new [AssetCountByTimeBucket] instance.
  AssetCountByTimeBucket({
    required this.timeBucket,
    required this.count,
  });

  String timeBucket;

  int count;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCountByTimeBucket &&
     other.timeBucket == timeBucket &&
     other.count == count;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (timeBucket.hashCode) +
    (count.hashCode);

  @override
  String toString() => 'AssetCountByTimeBucket[timeBucket=$timeBucket, count=$count]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'timeBucket'] = this.timeBucket;
      json[r'count'] = this.count;
    return json;
  }

  /// Returns a new [AssetCountByTimeBucket] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCountByTimeBucket? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetCountByTimeBucket(
        timeBucket: mapValueOfType<String>(json, r'timeBucket')!,
        count: mapValueOfType<int>(json, r'count')!,
      );
    }
    return null;
  }

  static List<AssetCountByTimeBucket> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCountByTimeBucket>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCountByTimeBucket.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCountByTimeBucket> mapFromJson(dynamic json) {
    final map = <String, AssetCountByTimeBucket>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByTimeBucket.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCountByTimeBucket-objects as value to a dart map
  static Map<String, List<AssetCountByTimeBucket>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCountByTimeBucket>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetCountByTimeBucket.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'timeBucket',
    'count',
  };
}

