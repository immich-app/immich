//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MetricsAssetCountConfig {
  /// Returns a new [MetricsAssetCountConfig] instance.
  MetricsAssetCountConfig({
    required this.image,
    required this.total,
    required this.video,
  });

  bool image;

  bool total;

  bool video;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MetricsAssetCountConfig &&
     other.image == image &&
     other.total == total &&
     other.video == video;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (image.hashCode) +
    (total.hashCode) +
    (video.hashCode);

  @override
  String toString() => 'MetricsAssetCountConfig[image=$image, total=$total, video=$video]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'image'] = this.image;
      json[r'total'] = this.total;
      json[r'video'] = this.video;
    return json;
  }

  /// Returns a new [MetricsAssetCountConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MetricsAssetCountConfig? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MetricsAssetCountConfig(
        image: mapValueOfType<bool>(json, r'image')!,
        total: mapValueOfType<bool>(json, r'total')!,
        video: mapValueOfType<bool>(json, r'video')!,
      );
    }
    return null;
  }

  static List<MetricsAssetCountConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MetricsAssetCountConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MetricsAssetCountConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MetricsAssetCountConfig> mapFromJson(dynamic json) {
    final map = <String, MetricsAssetCountConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MetricsAssetCountConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MetricsAssetCountConfig-objects as value to a dart map
  static Map<String, List<MetricsAssetCountConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MetricsAssetCountConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MetricsAssetCountConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'image',
    'total',
    'video',
  };
}

