//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImporterConfigResponseDto {
  /// Returns a new [ImporterConfigResponseDto] instance.
  ImporterConfigResponseDto({
    required this.apiKey,
    required this.oauth,
    required this.serverUrl,
  });

  String apiKey;

  ImporterConfigResponseDtoOauth oauth;

  String serverUrl;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImporterConfigResponseDto &&
    other.apiKey == apiKey &&
    other.oauth == oauth &&
    other.serverUrl == serverUrl;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (apiKey.hashCode) +
    (oauth.hashCode) +
    (serverUrl.hashCode);

  @override
  String toString() => 'ImporterConfigResponseDto[apiKey=$apiKey, oauth=$oauth, serverUrl=$serverUrl]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'apiKey'] = this.apiKey;
      json[r'oauth'] = this.oauth;
      json[r'serverUrl'] = this.serverUrl;
    return json;
  }

  /// Returns a new [ImporterConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImporterConfigResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ImporterConfigResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImporterConfigResponseDto(
        apiKey: mapValueOfType<String>(json, r'apiKey')!,
        oauth: ImporterConfigResponseDtoOauth.fromJson(json[r'oauth'])!,
        serverUrl: mapValueOfType<String>(json, r'serverUrl')!,
      );
    }
    return null;
  }

  static List<ImporterConfigResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImporterConfigResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImporterConfigResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImporterConfigResponseDto> mapFromJson(dynamic json) {
    final map = <String, ImporterConfigResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImporterConfigResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImporterConfigResponseDto-objects as value to a dart map
  static Map<String, List<ImporterConfigResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImporterConfigResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImporterConfigResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'apiKey',
    'oauth',
    'serverUrl',
  };
}

