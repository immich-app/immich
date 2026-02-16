//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthBackchannelLogoutDto {
  /// Returns a new [OAuthBackchannelLogoutDto] instance.
  OAuthBackchannelLogoutDto({
    required this.logoutToken,
  });

  /// OAuth logout token
  String logoutToken;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthBackchannelLogoutDto &&
    other.logoutToken == logoutToken;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (logoutToken.hashCode);

  @override
  String toString() => 'OAuthBackchannelLogoutDto[logoutToken=$logoutToken]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'logout_token'] = this.logoutToken;
    return json;
  }

  /// Returns a new [OAuthBackchannelLogoutDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthBackchannelLogoutDto? fromJson(dynamic value) {
    upgradeDto(value, "OAuthBackchannelLogoutDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OAuthBackchannelLogoutDto(
        logoutToken: mapValueOfType<String>(json, r'logout_token')!,
      );
    }
    return null;
  }

  static List<OAuthBackchannelLogoutDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthBackchannelLogoutDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthBackchannelLogoutDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthBackchannelLogoutDto> mapFromJson(dynamic json) {
    final map = <String, OAuthBackchannelLogoutDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthBackchannelLogoutDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthBackchannelLogoutDto-objects as value to a dart map
  static Map<String, List<OAuthBackchannelLogoutDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OAuthBackchannelLogoutDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OAuthBackchannelLogoutDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'logout_token',
  };
}

