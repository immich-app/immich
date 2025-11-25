//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CropParameters {
  /// Returns a new [CropParameters] instance.
  CropParameters({
    required this.bottom,
    required this.left,
    required this.right,
    required this.top,
  });

  /// Bottom position of the crop
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  num bottom;

  /// Left position of the crop
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  num left;

  /// Right position of the crop
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  num right;

  /// Top position of the crop
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  num top;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CropParameters &&
    other.bottom == bottom &&
    other.left == left &&
    other.right == right &&
    other.top == top;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (bottom.hashCode) +
    (left.hashCode) +
    (right.hashCode) +
    (top.hashCode);

  @override
  String toString() => 'CropParameters[bottom=$bottom, left=$left, right=$right, top=$top]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'bottom'] = this.bottom;
      json[r'left'] = this.left;
      json[r'right'] = this.right;
      json[r'top'] = this.top;
    return json;
  }

  /// Returns a new [CropParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CropParameters? fromJson(dynamic value) {
    upgradeDto(value, "CropParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CropParameters(
        bottom: num.parse('${json[r'bottom']}'),
        left: num.parse('${json[r'left']}'),
        right: num.parse('${json[r'right']}'),
        top: num.parse('${json[r'top']}'),
      );
    }
    return null;
  }

  static List<CropParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CropParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CropParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CropParameters> mapFromJson(dynamic json) {
    final map = <String, CropParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CropParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CropParameters-objects as value to a dart map
  static Map<String, List<CropParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CropParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CropParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'bottom',
    'left',
    'right',
    'top',
  };
}

