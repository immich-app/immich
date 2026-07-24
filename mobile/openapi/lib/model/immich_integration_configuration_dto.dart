//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImmichIntegrationConfigurationDto {
  /// Returns a new [ImmichIntegrationConfigurationDto] instance.
  ImmichIntegrationConfigurationDto({
    required this.backupConfiguration,
    this.dataFolders = const [],
    required this.libraries,
  });

  bool backupConfiguration;

  List<String> dataFolders;

  ConfigureImmichIntegrationRequestDtoLibraries libraries;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImmichIntegrationConfigurationDto &&
    other.backupConfiguration == backupConfiguration &&
    _deepEquality.equals(other.dataFolders, dataFolders) &&
    other.libraries == libraries;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backupConfiguration.hashCode) +
    (dataFolders.hashCode) +
    (libraries.hashCode);

  @override
  String toString() => 'ImmichIntegrationConfigurationDto[backupConfiguration=$backupConfiguration, dataFolders=$dataFolders, libraries=$libraries]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backupConfiguration'] = this.backupConfiguration;
      json[r'dataFolders'] = this.dataFolders;
      json[r'libraries'] = this.libraries;
    return json;
  }

  /// Returns a new [ImmichIntegrationConfigurationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImmichIntegrationConfigurationDto? fromJson(dynamic value) {
    upgradeDto(value, "ImmichIntegrationConfigurationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImmichIntegrationConfigurationDto(
        backupConfiguration: mapValueOfType<bool>(json, r'backupConfiguration')!,
        dataFolders: json[r'dataFolders'] is Iterable
            ? (json[r'dataFolders'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        libraries: ConfigureImmichIntegrationRequestDtoLibraries.fromJson(json[r'libraries'])!,
      );
    }
    return null;
  }

  static List<ImmichIntegrationConfigurationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImmichIntegrationConfigurationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImmichIntegrationConfigurationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImmichIntegrationConfigurationDto> mapFromJson(dynamic json) {
    final map = <String, ImmichIntegrationConfigurationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImmichIntegrationConfigurationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImmichIntegrationConfigurationDto-objects as value to a dart map
  static Map<String, List<ImmichIntegrationConfigurationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImmichIntegrationConfigurationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImmichIntegrationConfigurationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backupConfiguration',
    'dataFolders',
    'libraries',
  };
}

