//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImmichIntegrationDto {
  /// Returns a new [ImmichIntegrationDto] instance.
  ImmichIntegrationDto({
    required this.configuration,
    required this.id,
    required this.scheduleId,
  });

  ImmichIntegrationConfigurationDto configuration;

  String id;

  String scheduleId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImmichIntegrationDto &&
    other.configuration == configuration &&
    other.id == id &&
    other.scheduleId == scheduleId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (configuration.hashCode) +
    (id.hashCode) +
    (scheduleId.hashCode);

  @override
  String toString() => 'ImmichIntegrationDto[configuration=$configuration, id=$id, scheduleId=$scheduleId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'configuration'] = this.configuration;
      json[r'id'] = this.id;
      json[r'scheduleId'] = this.scheduleId;
    return json;
  }

  /// Returns a new [ImmichIntegrationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImmichIntegrationDto? fromJson(dynamic value) {
    upgradeDto(value, "ImmichIntegrationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImmichIntegrationDto(
        configuration: ImmichIntegrationConfigurationDto.fromJson(json[r'configuration'])!,
        id: mapValueOfType<String>(json, r'id')!,
        scheduleId: mapValueOfType<String>(json, r'scheduleId')!,
      );
    }
    return null;
  }

  static List<ImmichIntegrationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImmichIntegrationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImmichIntegrationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImmichIntegrationDto> mapFromJson(dynamic json) {
    final map = <String, ImmichIntegrationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImmichIntegrationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImmichIntegrationDto-objects as value to a dart map
  static Map<String, List<ImmichIntegrationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImmichIntegrationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImmichIntegrationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'configuration',
    'id',
    'scheduleId',
  };
}

