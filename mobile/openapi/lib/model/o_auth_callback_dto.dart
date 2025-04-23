//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthCallbackDto {
  /// Returns a new [OAuthCallbackDto] instance.
  OAuthCallbackDto({
    required this.url,
    required this.state,
    required this.codeVerifier,
  });

  String url;
  String state;
  String codeVerifier;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OAuthCallbackDto &&
          other.url == url &&
          other.state == state &&
          other.codeVerifier == codeVerifier;

  @override
  int get hashCode =>
      // ignore: unnecessary_parenthesis
      (url.hashCode) + (state.hashCode) + (codeVerifier.hashCode);

  @override
  String toString() =>
      'OAuthCallbackDto[url=$url, state=$state, codeVerifier=$codeVerifier]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'url'] = this.url;
    json[r'state'] = this.state;
    json[r'codeVerifier'] = this.codeVerifier;
    return json;
  }

  /// Returns a new [OAuthCallbackDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthCallbackDto? fromJson(dynamic value) {
    upgradeDto(value, "OAuthCallbackDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OAuthCallbackDto(
        url: mapValueOfType<String>(json, r'url')!,
        state: mapValueOfType<String>(json, r'state')!,
        codeVerifier: mapValueOfType<String>(json, r'codeVerifier')!,
      );
    }
    return null;
  }

  static List<OAuthCallbackDto> listFromJson(
    dynamic json, {
    bool growable = false,
  }) {
    final result = <OAuthCallbackDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthCallbackDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthCallbackDto> mapFromJson(dynamic json) {
    final map = <String, OAuthCallbackDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthCallbackDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthCallbackDto-objects as value to a dart map
  static Map<String, List<OAuthCallbackDto>> mapListFromJson(
    dynamic json, {
    bool growable = false,
  }) {
    final map = <String, List<OAuthCallbackDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OAuthCallbackDto.listFromJson(
          entry.value,
          growable: growable,
        );
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'url',
    'state',
    'codeVerifier',
  };
}
