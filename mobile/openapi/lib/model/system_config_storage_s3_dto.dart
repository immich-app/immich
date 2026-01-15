//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStorageS3Dto {
  /// Returns a new [SystemConfigStorageS3Dto] instance.
  SystemConfigStorageS3Dto({
    required this.accessKeyId,
    required this.bucket,
    required this.enabled,
    required this.endpoint,
    required this.forcePathStyle,
    required this.prefix,
    required this.region,
    required this.secretAccessKey,
    required this.storageClasses,
  });

  String accessKeyId;

  String bucket;

  bool enabled;

  String endpoint;

  bool forcePathStyle;

  String prefix;

  String region;

  String secretAccessKey;

  SystemConfigStorageClassesDto storageClasses;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStorageS3Dto &&
    other.accessKeyId == accessKeyId &&
    other.bucket == bucket &&
    other.enabled == enabled &&
    other.endpoint == endpoint &&
    other.forcePathStyle == forcePathStyle &&
    other.prefix == prefix &&
    other.region == region &&
    other.secretAccessKey == secretAccessKey &&
    other.storageClasses == storageClasses;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accessKeyId.hashCode) +
    (bucket.hashCode) +
    (enabled.hashCode) +
    (endpoint.hashCode) +
    (forcePathStyle.hashCode) +
    (prefix.hashCode) +
    (region.hashCode) +
    (secretAccessKey.hashCode) +
    (storageClasses.hashCode);

  @override
  String toString() => 'SystemConfigStorageS3Dto[accessKeyId=$accessKeyId, bucket=$bucket, enabled=$enabled, endpoint=$endpoint, forcePathStyle=$forcePathStyle, prefix=$prefix, region=$region, secretAccessKey=$secretAccessKey, storageClasses=$storageClasses]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accessKeyId'] = this.accessKeyId;
      json[r'bucket'] = this.bucket;
      json[r'enabled'] = this.enabled;
      json[r'endpoint'] = this.endpoint;
      json[r'forcePathStyle'] = this.forcePathStyle;
      json[r'prefix'] = this.prefix;
      json[r'region'] = this.region;
      json[r'secretAccessKey'] = this.secretAccessKey;
      json[r'storageClasses'] = this.storageClasses;
    return json;
  }

  /// Returns a new [SystemConfigStorageS3Dto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStorageS3Dto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigStorageS3Dto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStorageS3Dto(
        accessKeyId: mapValueOfType<String>(json, r'accessKeyId')!,
        bucket: mapValueOfType<String>(json, r'bucket')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        endpoint: mapValueOfType<String>(json, r'endpoint')!,
        forcePathStyle: mapValueOfType<bool>(json, r'forcePathStyle')!,
        prefix: mapValueOfType<String>(json, r'prefix')!,
        region: mapValueOfType<String>(json, r'region')!,
        secretAccessKey: mapValueOfType<String>(json, r'secretAccessKey')!,
        storageClasses: SystemConfigStorageClassesDto.fromJson(json[r'storageClasses'])!,
      );
    }
    return null;
  }

  static List<SystemConfigStorageS3Dto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageS3Dto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageS3Dto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStorageS3Dto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStorageS3Dto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStorageS3Dto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStorageS3Dto-objects as value to a dart map
  static Map<String, List<SystemConfigStorageS3Dto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStorageS3Dto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStorageS3Dto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'accessKeyId',
    'bucket',
    'enabled',
    'endpoint',
    'forcePathStyle',
    'prefix',
    'region',
    'secretAccessKey',
    'storageClasses',
  };
}

