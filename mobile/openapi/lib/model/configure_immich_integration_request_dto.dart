//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ConfigureImmichIntegrationRequestDto {
  /// Returns a new [ConfigureImmichIntegrationRequestDto] instance.
  ConfigureImmichIntegrationRequestDto({
    required this.backupConfiguration,
    required this.cron,
    this.dataFolders = const [],
    required this.libraries,
    required this.name,
    this.retentionPolicy = const Optional.absent(),
    required this.worm,
  });

  bool backupConfiguration;

  String cron;

  List<String> dataFolders;

  ConfigureImmichIntegrationRequestDtoLibraries libraries;

  String name;

  Optional<RetentionPolicyDto?> retentionPolicy;

  bool worm;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ConfigureImmichIntegrationRequestDto &&
    other.backupConfiguration == backupConfiguration &&
    other.cron == cron &&
    _deepEquality.equals(other.dataFolders, dataFolders) &&
    other.libraries == libraries &&
    other.name == name &&
    other.retentionPolicy == retentionPolicy &&
    other.worm == worm;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backupConfiguration.hashCode) +
    (cron.hashCode) +
    (dataFolders.hashCode) +
    (libraries.hashCode) +
    (name.hashCode) +
    (retentionPolicy == null ? 0 : retentionPolicy!.hashCode) +
    (worm.hashCode);

  @override
  String toString() => 'ConfigureImmichIntegrationRequestDto[backupConfiguration=$backupConfiguration, cron=$cron, dataFolders=$dataFolders, libraries=$libraries, name=$name, retentionPolicy=$retentionPolicy, worm=$worm]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backupConfiguration'] = this.backupConfiguration;
      json[r'cron'] = this.cron;
      json[r'dataFolders'] = this.dataFolders;
      json[r'libraries'] = this.libraries;
      json[r'name'] = this.name;
    if (this.retentionPolicy.isPresent) {
      final value = this.retentionPolicy.value;
      json[r'retentionPolicy'] = value;
    }
      json[r'worm'] = this.worm;
    return json;
  }

  /// Returns a new [ConfigureImmichIntegrationRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ConfigureImmichIntegrationRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "ConfigureImmichIntegrationRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ConfigureImmichIntegrationRequestDto(
        backupConfiguration: mapValueOfType<bool>(json, r'backupConfiguration')!,
        cron: mapValueOfType<String>(json, r'cron')!,
        dataFolders: json[r'dataFolders'] is Iterable
            ? (json[r'dataFolders'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        libraries: ConfigureImmichIntegrationRequestDtoLibraries.fromJson(json[r'libraries'])!,
        name: mapValueOfType<String>(json, r'name')!,
        retentionPolicy: json.containsKey(r'retentionPolicy') ? Optional.present(RetentionPolicyDto.fromJson(json[r'retentionPolicy'])) : const Optional.absent(),
        worm: mapValueOfType<bool>(json, r'worm')!,
      );
    }
    return null;
  }

  static List<ConfigureImmichIntegrationRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ConfigureImmichIntegrationRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ConfigureImmichIntegrationRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ConfigureImmichIntegrationRequestDto> mapFromJson(dynamic json) {
    final map = <String, ConfigureImmichIntegrationRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ConfigureImmichIntegrationRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ConfigureImmichIntegrationRequestDto-objects as value to a dart map
  static Map<String, List<ConfigureImmichIntegrationRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ConfigureImmichIntegrationRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ConfigureImmichIntegrationRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backupConfiguration',
    'cron',
    'dataFolders',
    'libraries',
    'name',
    'worm',
  };
}

