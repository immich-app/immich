//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ApiKeyCreateResponseDto {
  /// Returns a new [ApiKeyCreateResponseDto] instance.
  ApiKeyCreateResponseDto({
    required this.apiKey,
    required this.secret,
  });

  ApiKeyResponseDto apiKey;

  /// API key secret (only shown once)
  String secret;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ApiKeyCreateResponseDto &&
    other.apiKey == apiKey &&
    other.secret == secret;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (apiKey.hashCode) +
    (secret.hashCode);

  @override
  String toString() => 'ApiKeyCreateResponseDto[apiKey=$apiKey, secret=$secret]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'apiKey'] = this.apiKey;
      json[r'secret'] = this.secret;
    return json;
  }

  /// Returns a new [ApiKeyCreateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ApiKeyCreateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ApiKeyCreateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ApiKeyCreateResponseDto(
        apiKey: ApiKeyResponseDto.fromJson(json[r'apiKey'])!,
        secret: mapValueOfType<String>(json, r'secret')!,
      );
    }
    return null;
  }

  static List<ApiKeyCreateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ApiKeyCreateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ApiKeyCreateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ApiKeyCreateResponseDto> mapFromJson(dynamic json) {
    final map = <String, ApiKeyCreateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ApiKeyCreateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ApiKeyCreateResponseDto-objects as value to a dart map
  static Map<String, List<ApiKeyCreateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ApiKeyCreateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ApiKeyCreateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'apiKey',
    'secret',
  };
}

