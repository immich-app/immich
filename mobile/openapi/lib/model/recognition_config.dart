//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RecognitionConfig {
  /// Returns a new [RecognitionConfig] instance.
  RecognitionConfig({
    required this.enabled,
    required this.maxDistance,
    required this.minFaces,
    required this.minScore,
    required this.modelName,
    this.modelType,
  });

  bool enabled;

  /// Minimum value: 0
  /// Maximum value: 2
  double maxDistance;

  /// Minimum value: 1
  int minFaces;

  /// Minimum value: 0
  /// Maximum value: 1
  double minScore;

  String modelName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ModelType? modelType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RecognitionConfig &&
    other.enabled == enabled &&
    other.maxDistance == maxDistance &&
    other.minFaces == minFaces &&
    other.minScore == minScore &&
    other.modelName == modelName &&
    other.modelType == modelType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (maxDistance.hashCode) +
    (minFaces.hashCode) +
    (minScore.hashCode) +
    (modelName.hashCode) +
    (modelType == null ? 0 : modelType!.hashCode);

  @override
  String toString() => 'RecognitionConfig[enabled=$enabled, maxDistance=$maxDistance, minFaces=$minFaces, minScore=$minScore, modelName=$modelName, modelType=$modelType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'maxDistance'] = this.maxDistance;
      json[r'minFaces'] = this.minFaces;
      json[r'minScore'] = this.minScore;
      json[r'modelName'] = this.modelName;
    if (this.modelType != null) {
      json[r'modelType'] = this.modelType;
    } else {
    //  json[r'modelType'] = null;
    }
    return json;
  }

  /// Returns a new [RecognitionConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RecognitionConfig? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RecognitionConfig(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        maxDistance: mapValueOfType<double>(json, r'maxDistance')!,
        minFaces: mapValueOfType<int>(json, r'minFaces')!,
        minScore: mapValueOfType<double>(json, r'minScore')!,
        modelName: mapValueOfType<String>(json, r'modelName')!,
        modelType: ModelType.fromJson(json[r'modelType']),
      );
    }
    return null;
  }

  static List<RecognitionConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RecognitionConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RecognitionConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RecognitionConfig> mapFromJson(dynamic json) {
    final map = <String, RecognitionConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RecognitionConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RecognitionConfig-objects as value to a dart map
  static Map<String, List<RecognitionConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RecognitionConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RecognitionConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'maxDistance',
    'minFaces',
    'minScore',
    'modelName',
  };
}

