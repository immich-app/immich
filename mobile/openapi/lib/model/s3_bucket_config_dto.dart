//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class S3BucketConfigDto {
  /// Returns a new [S3BucketConfigDto] instance.
  S3BucketConfigDto({
    this.accessKeyId,
    required this.bucket,
    this.endpoint,
    this.forcePathStyle,
    this.prefix,
    this.publicEndpoint,
    this.region,
    this.secretAccessKey,
    this.storageClass,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? accessKeyId;

  String bucket;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? endpoint;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? forcePathStyle;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? prefix;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? publicEndpoint;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? region;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? secretAccessKey;

  S3BucketConfigDtoStorageClassEnum? storageClass;

  @override
  bool operator ==(Object other) => identical(this, other) || other is S3BucketConfigDto &&
    other.accessKeyId == accessKeyId &&
    other.bucket == bucket &&
    other.endpoint == endpoint &&
    other.forcePathStyle == forcePathStyle &&
    other.prefix == prefix &&
    other.publicEndpoint == publicEndpoint &&
    other.region == region &&
    other.secretAccessKey == secretAccessKey &&
    other.storageClass == storageClass;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accessKeyId == null ? 0 : accessKeyId!.hashCode) +
    (bucket.hashCode) +
    (endpoint == null ? 0 : endpoint!.hashCode) +
    (forcePathStyle == null ? 0 : forcePathStyle!.hashCode) +
    (prefix == null ? 0 : prefix!.hashCode) +
    (publicEndpoint == null ? 0 : publicEndpoint!.hashCode) +
    (region == null ? 0 : region!.hashCode) +
    (secretAccessKey == null ? 0 : secretAccessKey!.hashCode) +
    (storageClass == null ? 0 : storageClass!.hashCode);

  @override
  String toString() => 'S3BucketConfigDto[accessKeyId=$accessKeyId, bucket=$bucket, endpoint=$endpoint, forcePathStyle=$forcePathStyle, prefix=$prefix, publicEndpoint=$publicEndpoint, region=$region, secretAccessKey=$secretAccessKey, storageClass=$storageClass]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.accessKeyId != null) {
      json[r'accessKeyId'] = this.accessKeyId;
    } else {
    //  json[r'accessKeyId'] = null;
    }
      json[r'bucket'] = this.bucket;
    if (this.endpoint != null) {
      json[r'endpoint'] = this.endpoint;
    } else {
    //  json[r'endpoint'] = null;
    }
    if (this.forcePathStyle != null) {
      json[r'forcePathStyle'] = this.forcePathStyle;
    } else {
    //  json[r'forcePathStyle'] = null;
    }
    if (this.prefix != null) {
      json[r'prefix'] = this.prefix;
    } else {
    //  json[r'prefix'] = null;
    }
    if (this.publicEndpoint != null) {
      json[r'publicEndpoint'] = this.publicEndpoint;
    } else {
    //  json[r'publicEndpoint'] = null;
    }
    if (this.region != null) {
      json[r'region'] = this.region;
    } else {
    //  json[r'region'] = null;
    }
    if (this.secretAccessKey != null) {
      json[r'secretAccessKey'] = this.secretAccessKey;
    } else {
    //  json[r'secretAccessKey'] = null;
    }
    if (this.storageClass != null) {
      json[r'storageClass'] = this.storageClass;
    } else {
    //  json[r'storageClass'] = null;
    }
    return json;
  }

  /// Returns a new [S3BucketConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static S3BucketConfigDto? fromJson(dynamic value) {
    upgradeDto(value, "S3BucketConfigDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return S3BucketConfigDto(
        accessKeyId: mapValueOfType<String>(json, r'accessKeyId'),
        bucket: mapValueOfType<String>(json, r'bucket')!,
        endpoint: mapValueOfType<String>(json, r'endpoint'),
        forcePathStyle: mapValueOfType<bool>(json, r'forcePathStyle'),
        prefix: mapValueOfType<String>(json, r'prefix'),
        publicEndpoint: mapValueOfType<String>(json, r'publicEndpoint'),
        region: mapValueOfType<String>(json, r'region'),
        secretAccessKey: mapValueOfType<String>(json, r'secretAccessKey'),
        storageClass: S3BucketConfigDtoStorageClassEnum.fromJson(json[r'storageClass']),
      );
    }
    return null;
  }

  static List<S3BucketConfigDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <S3BucketConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = S3BucketConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, S3BucketConfigDto> mapFromJson(dynamic json) {
    final map = <String, S3BucketConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = S3BucketConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of S3BucketConfigDto-objects as value to a dart map
  static Map<String, List<S3BucketConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<S3BucketConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = S3BucketConfigDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'bucket',
  };
}


class S3BucketConfigDtoStorageClassEnum {
  /// Instantiate a new enum with the provided [value].
  const S3BucketConfigDtoStorageClassEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = S3BucketConfigDtoStorageClassEnum._(r'STANDARD');
  static const STANDARD_IA = S3BucketConfigDtoStorageClassEnum._(r'STANDARD_IA');
  static const GLACIER_IR = S3BucketConfigDtoStorageClassEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][S3BucketConfigDtoStorageClassEnum].
  static const values = <S3BucketConfigDtoStorageClassEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static S3BucketConfigDtoStorageClassEnum? fromJson(dynamic value) => S3BucketConfigDtoStorageClassEnumTypeTransformer().decode(value);

  static List<S3BucketConfigDtoStorageClassEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <S3BucketConfigDtoStorageClassEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = S3BucketConfigDtoStorageClassEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [S3BucketConfigDtoStorageClassEnum] to String,
/// and [decode] dynamic data back to [S3BucketConfigDtoStorageClassEnum].
class S3BucketConfigDtoStorageClassEnumTypeTransformer {
  factory S3BucketConfigDtoStorageClassEnumTypeTransformer() => _instance ??= const S3BucketConfigDtoStorageClassEnumTypeTransformer._();

  const S3BucketConfigDtoStorageClassEnumTypeTransformer._();

  String encode(S3BucketConfigDtoStorageClassEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a S3BucketConfigDtoStorageClassEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  S3BucketConfigDtoStorageClassEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return S3BucketConfigDtoStorageClassEnum.STANDARD;
        case r'STANDARD_IA': return S3BucketConfigDtoStorageClassEnum.STANDARD_IA;
        case r'GLACIER_IR': return S3BucketConfigDtoStorageClassEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [S3BucketConfigDtoStorageClassEnumTypeTransformer] instance.
  static S3BucketConfigDtoStorageClassEnumTypeTransformer? _instance;
}


