//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthAuthorizeResponseDto {
  /// Returns a new [OAuthAuthorizeResponseDto] instance.
  OAuthAuthorizeResponseDto({
    required this.url,
  });

  String url;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthAuthorizeResponseDto &&
    other.url == url;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (url.hashCode);

  @override
  String toString() => 'OAuthAuthorizeResponseDto[url=$url]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'url'] = this.url;
    return json;
  }

  /// Returns a new [OAuthAuthorizeResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthAuthorizeResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OAuthAuthorizeResponseDto(
        url: mapValueOfType<String>(json, r'url')!,
      );
    }
    return null;
  }

  static List<OAuthAuthorizeResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthAuthorizeResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthAuthorizeResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthAuthorizeResponseDto> mapFromJson(dynamic json) {
    final map = <String, OAuthAuthorizeResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthAuthorizeResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthAuthorizeResponseDto-objects as value to a dart map
  static Map<String, List<OAuthAuthorizeResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OAuthAuthorizeResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OAuthAuthorizeResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'url',
  };
}

