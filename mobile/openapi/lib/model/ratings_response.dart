//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RatingsResponse {
  /// Returns a new [RatingsResponse] instance.
  RatingsResponse({
    this.enabled = false,
  });

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RatingsResponse &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode);

  @override
  String toString() => 'RatingsResponse[enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [RatingsResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RatingsResponse? fromJson(dynamic value) {
    upgradeDto(value, "RatingsResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RatingsResponse(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<RatingsResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RatingsResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RatingsResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RatingsResponse> mapFromJson(dynamic json) {
    final map = <String, RatingsResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RatingsResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RatingsResponse-objects as value to a dart map
  static Map<String, List<RatingsResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RatingsResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RatingsResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
  };
}

