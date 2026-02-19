//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FilterParameters {
  /// Returns a new [FilterParameters] instance.
  FilterParameters({
    required this.bOffset,
    required this.bbBias,
    required this.bgBias,
    required this.brBias,
    required this.gOffset,
    required this.gbBias,
    required this.ggBias,
    required this.grBias,
    required this.rOffset,
    required this.rbBias,
    required this.rgBias,
    required this.rrBias,
  });

  /// B Offset (-255 -> 255)
  ///
  /// Minimum value: -255
  /// Maximum value: 255
  num bOffset;

  /// BB Bias
  num bbBias;

  /// BG Bias
  num bgBias;

  /// BR Bias
  num brBias;

  /// G Offset (-255 -> 255)
  ///
  /// Minimum value: -255
  /// Maximum value: 255
  num gOffset;

  /// GB Bias
  num gbBias;

  /// GG Bias
  num ggBias;

  /// GR Bias
  num grBias;

  /// R Offset (-255 -> 255)
  ///
  /// Minimum value: -255
  /// Maximum value: 255
  num rOffset;

  /// RB Bias
  num rbBias;

  /// RG Bias
  num rgBias;

  /// RR Bias
  num rrBias;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FilterParameters &&
    other.bOffset == bOffset &&
    other.bbBias == bbBias &&
    other.bgBias == bgBias &&
    other.brBias == brBias &&
    other.gOffset == gOffset &&
    other.gbBias == gbBias &&
    other.ggBias == ggBias &&
    other.grBias == grBias &&
    other.rOffset == rOffset &&
    other.rbBias == rbBias &&
    other.rgBias == rgBias &&
    other.rrBias == rrBias;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (bOffset.hashCode) +
    (bbBias.hashCode) +
    (bgBias.hashCode) +
    (brBias.hashCode) +
    (gOffset.hashCode) +
    (gbBias.hashCode) +
    (ggBias.hashCode) +
    (grBias.hashCode) +
    (rOffset.hashCode) +
    (rbBias.hashCode) +
    (rgBias.hashCode) +
    (rrBias.hashCode);

  @override
  String toString() => 'FilterParameters[bOffset=$bOffset, bbBias=$bbBias, bgBias=$bgBias, brBias=$brBias, gOffset=$gOffset, gbBias=$gbBias, ggBias=$ggBias, grBias=$grBias, rOffset=$rOffset, rbBias=$rbBias, rgBias=$rgBias, rrBias=$rrBias]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'bOffset'] = this.bOffset;
      json[r'bbBias'] = this.bbBias;
      json[r'bgBias'] = this.bgBias;
      json[r'brBias'] = this.brBias;
      json[r'gOffset'] = this.gOffset;
      json[r'gbBias'] = this.gbBias;
      json[r'ggBias'] = this.ggBias;
      json[r'grBias'] = this.grBias;
      json[r'rOffset'] = this.rOffset;
      json[r'rbBias'] = this.rbBias;
      json[r'rgBias'] = this.rgBias;
      json[r'rrBias'] = this.rrBias;
    return json;
  }

  /// Returns a new [FilterParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FilterParameters? fromJson(dynamic value) {
    upgradeDto(value, "FilterParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FilterParameters(
        bOffset: num.parse('${json[r'bOffset']}'),
        bbBias: num.parse('${json[r'bbBias']}'),
        bgBias: num.parse('${json[r'bgBias']}'),
        brBias: num.parse('${json[r'brBias']}'),
        gOffset: num.parse('${json[r'gOffset']}'),
        gbBias: num.parse('${json[r'gbBias']}'),
        ggBias: num.parse('${json[r'ggBias']}'),
        grBias: num.parse('${json[r'grBias']}'),
        rOffset: num.parse('${json[r'rOffset']}'),
        rbBias: num.parse('${json[r'rbBias']}'),
        rgBias: num.parse('${json[r'rgBias']}'),
        rrBias: num.parse('${json[r'rrBias']}'),
      );
    }
    return null;
  }

  static List<FilterParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FilterParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FilterParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FilterParameters> mapFromJson(dynamic json) {
    final map = <String, FilterParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FilterParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FilterParameters-objects as value to a dart map
  static Map<String, List<FilterParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FilterParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FilterParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'bOffset',
    'bbBias',
    'bgBias',
    'brBias',
    'gOffset',
    'gbBias',
    'ggBias',
    'grBias',
    'rOffset',
    'rbBias',
    'rgBias',
    'rrBias',
  };
}

