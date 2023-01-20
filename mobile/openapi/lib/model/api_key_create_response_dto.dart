//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class APIKeyCreateResponseDto {
  /// Returns a new [APIKeyCreateResponseDto] instance.
  APIKeyCreateResponseDto({
    required this.secret,
    required this.apiKey,
  });

  String secret;

  APIKeyResponseDto apiKey;

  @override
  bool operator ==(Object other) => identical(this, other) || other is APIKeyCreateResponseDto &&
     other.secret == secret &&
     other.apiKey == apiKey;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (secret.hashCode) +
    (apiKey.hashCode);

  @override
  String toString() => 'APIKeyCreateResponseDto[secret=$secret, apiKey=$apiKey]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'secret'] = this.secret;
      json[r'apiKey'] = this.apiKey;
    return json;
  }

  /// Returns a new [APIKeyCreateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static APIKeyCreateResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "APIKeyCreateResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "APIKeyCreateResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return APIKeyCreateResponseDto(
        secret: mapValueOfType<String>(json, r'secret')!,
        apiKey: APIKeyResponseDto.fromJson(json[r'apiKey'])!,
      );
    }
    return null;
  }

  static List<APIKeyCreateResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <APIKeyCreateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = APIKeyCreateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, APIKeyCreateResponseDto> mapFromJson(dynamic json) {
    final map = <String, APIKeyCreateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyCreateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of APIKeyCreateResponseDto-objects as value to a dart map
  static Map<String, List<APIKeyCreateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<APIKeyCreateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyCreateResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'secret',
    'apiKey',
  };
}

