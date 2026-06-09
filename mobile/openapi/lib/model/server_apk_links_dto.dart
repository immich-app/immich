//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerApkLinksDto {
  /// Returns a new [ServerApkLinksDto] instance.
  ServerApkLinksDto({
    required this.arm64v8a,
    required this.armeabiv7a,
    required this.universal,
    required this.x8664,
  });

  /// APK download link for ARM64 v8a architecture
  String arm64v8a;

  /// APK download link for ARM EABI v7a architecture
  String armeabiv7a;

  /// APK download link for universal architecture
  String universal;

  /// APK download link for x86_64 architecture
  String x8664;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerApkLinksDto &&
    other.arm64v8a == arm64v8a &&
    other.armeabiv7a == armeabiv7a &&
    other.universal == universal &&
    other.x8664 == x8664;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (arm64v8a.hashCode) +
    (armeabiv7a.hashCode) +
    (universal.hashCode) +
    (x8664.hashCode);

  @override
  String toString() => 'ServerApkLinksDto[arm64v8a=$arm64v8a, armeabiv7a=$armeabiv7a, universal=$universal, x8664=$x8664]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'arm64v8a'] = this.arm64v8a;
      json[r'armeabiv7a'] = this.armeabiv7a;
      json[r'universal'] = this.universal;
      json[r'x86_64'] = this.x8664;
    return json;
  }

  /// Returns a new [ServerApkLinksDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerApkLinksDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'arm64v8a'), 'Required key "ServerApkLinksDto[arm64v8a]" is missing from JSON.');
        assert(json[r'arm64v8a'] != null, 'Required key "ServerApkLinksDto[arm64v8a]" has a null value in JSON.');
        assert(json.containsKey(r'armeabiv7a'), 'Required key "ServerApkLinksDto[armeabiv7a]" is missing from JSON.');
        assert(json[r'armeabiv7a'] != null, 'Required key "ServerApkLinksDto[armeabiv7a]" has a null value in JSON.');
        assert(json.containsKey(r'universal'), 'Required key "ServerApkLinksDto[universal]" is missing from JSON.');
        assert(json[r'universal'] != null, 'Required key "ServerApkLinksDto[universal]" has a null value in JSON.');
        assert(json.containsKey(r'x86_64'), 'Required key "ServerApkLinksDto[x86_64]" is missing from JSON.');
        assert(json[r'x86_64'] != null, 'Required key "ServerApkLinksDto[x86_64]" has a null value in JSON.');
        return true;
      }());

      return ServerApkLinksDto(
        arm64v8a: mapValueOfType<String>(json, r'arm64v8a')!,
        armeabiv7a: mapValueOfType<String>(json, r'armeabiv7a')!,
        universal: mapValueOfType<String>(json, r'universal')!,
        x8664: mapValueOfType<String>(json, r'x86_64')!,
      );
    }
    return null;
  }

  static List<ServerApkLinksDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerApkLinksDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerApkLinksDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerApkLinksDto> mapFromJson(dynamic json) {
    final map = <String, ServerApkLinksDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerApkLinksDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerApkLinksDto-objects as value to a dart map
  static Map<String, List<ServerApkLinksDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerApkLinksDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerApkLinksDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'arm64v8a',
    'armeabiv7a',
    'universal',
    'x86_64',
  };
}

