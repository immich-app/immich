//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthConfigDto {
  /// Returns a new [OAuthConfigDto] instance.
  OAuthConfigDto({
    required this.redirectUri,
  });

  String redirectUri;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthConfigDto &&
    other.redirectUri == redirectUri;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (redirectUri.hashCode);

  @override
  String toString() => 'OAuthConfigDto[redirectUri=$redirectUri]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'redirectUri'] = this.redirectUri;
    return json;
  }

  /// Returns a new [OAuthConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthConfigDto? fromJson(dynamic value) {
    upgradeDto(value, "OAuthConfigDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OAuthConfigDto(
        redirectUri: mapValueOfType<String>(json, r'redirectUri')!,
      );
    }
    return null;
  }

  static List<OAuthConfigDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthConfigDto> mapFromJson(dynamic json) {
    final map = <String, OAuthConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthConfigDto-objects as value to a dart map
  static Map<String, List<OAuthConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OAuthConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OAuthConfigDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'redirectUri',
  };
}

