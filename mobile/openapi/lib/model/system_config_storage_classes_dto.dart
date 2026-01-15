//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStorageClassesDto {
  /// Returns a new [SystemConfigStorageClassesDto] instance.
  SystemConfigStorageClassesDto({
    required this.encodedVideos,
    required this.originalsPhotos,
    required this.originalsVideos,
    required this.previews,
    required this.thumbnails,
  });

  SystemConfigStorageClassesDtoEncodedVideosEnum encodedVideos;

  SystemConfigStorageClassesDtoOriginalsPhotosEnum originalsPhotos;

  SystemConfigStorageClassesDtoOriginalsVideosEnum originalsVideos;

  SystemConfigStorageClassesDtoPreviewsEnum previews;

  SystemConfigStorageClassesDtoThumbnailsEnum thumbnails;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStorageClassesDto &&
    other.encodedVideos == encodedVideos &&
    other.originalsPhotos == originalsPhotos &&
    other.originalsVideos == originalsVideos &&
    other.previews == previews &&
    other.thumbnails == thumbnails;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (encodedVideos.hashCode) +
    (originalsPhotos.hashCode) +
    (originalsVideos.hashCode) +
    (previews.hashCode) +
    (thumbnails.hashCode);

  @override
  String toString() => 'SystemConfigStorageClassesDto[encodedVideos=$encodedVideos, originalsPhotos=$originalsPhotos, originalsVideos=$originalsVideos, previews=$previews, thumbnails=$thumbnails]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'encodedVideos'] = this.encodedVideos;
      json[r'originalsPhotos'] = this.originalsPhotos;
      json[r'originalsVideos'] = this.originalsVideos;
      json[r'previews'] = this.previews;
      json[r'thumbnails'] = this.thumbnails;
    return json;
  }

  /// Returns a new [SystemConfigStorageClassesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStorageClassesDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigStorageClassesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStorageClassesDto(
        encodedVideos: SystemConfigStorageClassesDtoEncodedVideosEnum.fromJson(json[r'encodedVideos'])!,
        originalsPhotos: SystemConfigStorageClassesDtoOriginalsPhotosEnum.fromJson(json[r'originalsPhotos'])!,
        originalsVideos: SystemConfigStorageClassesDtoOriginalsVideosEnum.fromJson(json[r'originalsVideos'])!,
        previews: SystemConfigStorageClassesDtoPreviewsEnum.fromJson(json[r'previews'])!,
        thumbnails: SystemConfigStorageClassesDtoThumbnailsEnum.fromJson(json[r'thumbnails'])!,
      );
    }
    return null;
  }

  static List<SystemConfigStorageClassesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStorageClassesDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStorageClassesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStorageClassesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStorageClassesDto-objects as value to a dart map
  static Map<String, List<SystemConfigStorageClassesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStorageClassesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStorageClassesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'encodedVideos',
    'originalsPhotos',
    'originalsVideos',
    'previews',
    'thumbnails',
  };
}


class SystemConfigStorageClassesDtoEncodedVideosEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigStorageClassesDtoEncodedVideosEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = SystemConfigStorageClassesDtoEncodedVideosEnum._(r'STANDARD');
  static const STANDARD_IA = SystemConfigStorageClassesDtoEncodedVideosEnum._(r'STANDARD_IA');
  static const GLACIER_IR = SystemConfigStorageClassesDtoEncodedVideosEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][SystemConfigStorageClassesDtoEncodedVideosEnum].
  static const values = <SystemConfigStorageClassesDtoEncodedVideosEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static SystemConfigStorageClassesDtoEncodedVideosEnum? fromJson(dynamic value) => SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer().decode(value);

  static List<SystemConfigStorageClassesDtoEncodedVideosEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDtoEncodedVideosEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDtoEncodedVideosEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigStorageClassesDtoEncodedVideosEnum] to String,
/// and [decode] dynamic data back to [SystemConfigStorageClassesDtoEncodedVideosEnum].
class SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer {
  factory SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer() => _instance ??= const SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer._();

  const SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer._();

  String encode(SystemConfigStorageClassesDtoEncodedVideosEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigStorageClassesDtoEncodedVideosEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigStorageClassesDtoEncodedVideosEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return SystemConfigStorageClassesDtoEncodedVideosEnum.STANDARD;
        case r'STANDARD_IA': return SystemConfigStorageClassesDtoEncodedVideosEnum.STANDARD_IA;
        case r'GLACIER_IR': return SystemConfigStorageClassesDtoEncodedVideosEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer] instance.
  static SystemConfigStorageClassesDtoEncodedVideosEnumTypeTransformer? _instance;
}



class SystemConfigStorageClassesDtoOriginalsPhotosEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigStorageClassesDtoOriginalsPhotosEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = SystemConfigStorageClassesDtoOriginalsPhotosEnum._(r'STANDARD');
  static const STANDARD_IA = SystemConfigStorageClassesDtoOriginalsPhotosEnum._(r'STANDARD_IA');
  static const GLACIER_IR = SystemConfigStorageClassesDtoOriginalsPhotosEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][SystemConfigStorageClassesDtoOriginalsPhotosEnum].
  static const values = <SystemConfigStorageClassesDtoOriginalsPhotosEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static SystemConfigStorageClassesDtoOriginalsPhotosEnum? fromJson(dynamic value) => SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer().decode(value);

  static List<SystemConfigStorageClassesDtoOriginalsPhotosEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDtoOriginalsPhotosEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDtoOriginalsPhotosEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigStorageClassesDtoOriginalsPhotosEnum] to String,
/// and [decode] dynamic data back to [SystemConfigStorageClassesDtoOriginalsPhotosEnum].
class SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer {
  factory SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer() => _instance ??= const SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer._();

  const SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer._();

  String encode(SystemConfigStorageClassesDtoOriginalsPhotosEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigStorageClassesDtoOriginalsPhotosEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigStorageClassesDtoOriginalsPhotosEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return SystemConfigStorageClassesDtoOriginalsPhotosEnum.STANDARD;
        case r'STANDARD_IA': return SystemConfigStorageClassesDtoOriginalsPhotosEnum.STANDARD_IA;
        case r'GLACIER_IR': return SystemConfigStorageClassesDtoOriginalsPhotosEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer] instance.
  static SystemConfigStorageClassesDtoOriginalsPhotosEnumTypeTransformer? _instance;
}



class SystemConfigStorageClassesDtoOriginalsVideosEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigStorageClassesDtoOriginalsVideosEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = SystemConfigStorageClassesDtoOriginalsVideosEnum._(r'STANDARD');
  static const STANDARD_IA = SystemConfigStorageClassesDtoOriginalsVideosEnum._(r'STANDARD_IA');
  static const GLACIER_IR = SystemConfigStorageClassesDtoOriginalsVideosEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][SystemConfigStorageClassesDtoOriginalsVideosEnum].
  static const values = <SystemConfigStorageClassesDtoOriginalsVideosEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static SystemConfigStorageClassesDtoOriginalsVideosEnum? fromJson(dynamic value) => SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer().decode(value);

  static List<SystemConfigStorageClassesDtoOriginalsVideosEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDtoOriginalsVideosEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDtoOriginalsVideosEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigStorageClassesDtoOriginalsVideosEnum] to String,
/// and [decode] dynamic data back to [SystemConfigStorageClassesDtoOriginalsVideosEnum].
class SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer {
  factory SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer() => _instance ??= const SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer._();

  const SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer._();

  String encode(SystemConfigStorageClassesDtoOriginalsVideosEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigStorageClassesDtoOriginalsVideosEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigStorageClassesDtoOriginalsVideosEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return SystemConfigStorageClassesDtoOriginalsVideosEnum.STANDARD;
        case r'STANDARD_IA': return SystemConfigStorageClassesDtoOriginalsVideosEnum.STANDARD_IA;
        case r'GLACIER_IR': return SystemConfigStorageClassesDtoOriginalsVideosEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer] instance.
  static SystemConfigStorageClassesDtoOriginalsVideosEnumTypeTransformer? _instance;
}



class SystemConfigStorageClassesDtoPreviewsEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigStorageClassesDtoPreviewsEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = SystemConfigStorageClassesDtoPreviewsEnum._(r'STANDARD');
  static const STANDARD_IA = SystemConfigStorageClassesDtoPreviewsEnum._(r'STANDARD_IA');
  static const GLACIER_IR = SystemConfigStorageClassesDtoPreviewsEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][SystemConfigStorageClassesDtoPreviewsEnum].
  static const values = <SystemConfigStorageClassesDtoPreviewsEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static SystemConfigStorageClassesDtoPreviewsEnum? fromJson(dynamic value) => SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer().decode(value);

  static List<SystemConfigStorageClassesDtoPreviewsEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDtoPreviewsEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDtoPreviewsEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigStorageClassesDtoPreviewsEnum] to String,
/// and [decode] dynamic data back to [SystemConfigStorageClassesDtoPreviewsEnum].
class SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer {
  factory SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer() => _instance ??= const SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer._();

  const SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer._();

  String encode(SystemConfigStorageClassesDtoPreviewsEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigStorageClassesDtoPreviewsEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigStorageClassesDtoPreviewsEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return SystemConfigStorageClassesDtoPreviewsEnum.STANDARD;
        case r'STANDARD_IA': return SystemConfigStorageClassesDtoPreviewsEnum.STANDARD_IA;
        case r'GLACIER_IR': return SystemConfigStorageClassesDtoPreviewsEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer] instance.
  static SystemConfigStorageClassesDtoPreviewsEnumTypeTransformer? _instance;
}



class SystemConfigStorageClassesDtoThumbnailsEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigStorageClassesDtoThumbnailsEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const STANDARD = SystemConfigStorageClassesDtoThumbnailsEnum._(r'STANDARD');
  static const STANDARD_IA = SystemConfigStorageClassesDtoThumbnailsEnum._(r'STANDARD_IA');
  static const GLACIER_IR = SystemConfigStorageClassesDtoThumbnailsEnum._(r'GLACIER_IR');

  /// List of all possible values in this [enum][SystemConfigStorageClassesDtoThumbnailsEnum].
  static const values = <SystemConfigStorageClassesDtoThumbnailsEnum>[
    STANDARD,
    STANDARD_IA,
    GLACIER_IR,
  ];

  static SystemConfigStorageClassesDtoThumbnailsEnum? fromJson(dynamic value) => SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer().decode(value);

  static List<SystemConfigStorageClassesDtoThumbnailsEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageClassesDtoThumbnailsEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageClassesDtoThumbnailsEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigStorageClassesDtoThumbnailsEnum] to String,
/// and [decode] dynamic data back to [SystemConfigStorageClassesDtoThumbnailsEnum].
class SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer {
  factory SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer() => _instance ??= const SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer._();

  const SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer._();

  String encode(SystemConfigStorageClassesDtoThumbnailsEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigStorageClassesDtoThumbnailsEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigStorageClassesDtoThumbnailsEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'STANDARD': return SystemConfigStorageClassesDtoThumbnailsEnum.STANDARD;
        case r'STANDARD_IA': return SystemConfigStorageClassesDtoThumbnailsEnum.STANDARD_IA;
        case r'GLACIER_IR': return SystemConfigStorageClassesDtoThumbnailsEnum.GLACIER_IR;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer] instance.
  static SystemConfigStorageClassesDtoThumbnailsEnumTypeTransformer? _instance;
}


