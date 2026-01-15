//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImporterConfigResponseDtoOauth {
  /// Returns a new [ImporterConfigResponseDtoOauth] instance.
  ImporterConfigResponseDtoOauth({
    required this.clientId,
    required this.clientSecret,
  });

  String clientId;

  String clientSecret;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImporterConfigResponseDtoOauth &&
    other.clientId == clientId &&
    other.clientSecret == clientSecret;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (clientId.hashCode) +
    (clientSecret.hashCode);

  @override
  String toString() => 'ImporterConfigResponseDtoOauth[clientId=$clientId, clientSecret=$clientSecret]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'clientId'] = this.clientId;
      json[r'clientSecret'] = this.clientSecret;
    return json;
  }

  /// Returns a new [ImporterConfigResponseDtoOauth] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImporterConfigResponseDtoOauth? fromJson(dynamic value) {
    upgradeDto(value, "ImporterConfigResponseDtoOauth");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImporterConfigResponseDtoOauth(
        clientId: mapValueOfType<String>(json, r'clientId')!,
        clientSecret: mapValueOfType<String>(json, r'clientSecret')!,
      );
    }
    return null;
  }

  static List<ImporterConfigResponseDtoOauth> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImporterConfigResponseDtoOauth>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImporterConfigResponseDtoOauth.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImporterConfigResponseDtoOauth> mapFromJson(dynamic json) {
    final map = <String, ImporterConfigResponseDtoOauth>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImporterConfigResponseDtoOauth.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImporterConfigResponseDtoOauth-objects as value to a dart map
  static Map<String, List<ImporterConfigResponseDtoOauth>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImporterConfigResponseDtoOauth>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImporterConfigResponseDtoOauth.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'clientId',
    'clientSecret',
  };
}

