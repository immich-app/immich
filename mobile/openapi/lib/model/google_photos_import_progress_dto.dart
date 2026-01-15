//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GooglePhotosImportProgressDto {
  /// Returns a new [GooglePhotosImportProgressDto] instance.
  GooglePhotosImportProgressDto({
    required this.albumsFound,
    required this.current,
    this.currentFile,
    this.errors = const [],
    required this.phase,
    required this.photosMatched,
    required this.photosMissingMetadata,
    required this.total,
  });

  /// Number of albums found
  num albumsFound;

  /// Current progress count
  num current;

  /// Current file being processed
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? currentFile;

  /// List of errors encountered
  List<String> errors;

  GooglePhotosImportProgressDtoPhaseEnum phase;

  /// Number of photos with metadata
  num photosMatched;

  /// Number of photos missing metadata
  num photosMissingMetadata;

  /// Total items to process
  num total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GooglePhotosImportProgressDto &&
    other.albumsFound == albumsFound &&
    other.current == current &&
    other.currentFile == currentFile &&
    _deepEquality.equals(other.errors, errors) &&
    other.phase == phase &&
    other.photosMatched == photosMatched &&
    other.photosMissingMetadata == photosMissingMetadata &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumsFound.hashCode) +
    (current.hashCode) +
    (currentFile == null ? 0 : currentFile!.hashCode) +
    (errors.hashCode) +
    (phase.hashCode) +
    (photosMatched.hashCode) +
    (photosMissingMetadata.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'GooglePhotosImportProgressDto[albumsFound=$albumsFound, current=$current, currentFile=$currentFile, errors=$errors, phase=$phase, photosMatched=$photosMatched, photosMissingMetadata=$photosMissingMetadata, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumsFound'] = this.albumsFound;
      json[r'current'] = this.current;
    if (this.currentFile != null) {
      json[r'currentFile'] = this.currentFile;
    } else {
    //  json[r'currentFile'] = null;
    }
      json[r'errors'] = this.errors;
      json[r'phase'] = this.phase;
      json[r'photosMatched'] = this.photosMatched;
      json[r'photosMissingMetadata'] = this.photosMissingMetadata;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [GooglePhotosImportProgressDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GooglePhotosImportProgressDto? fromJson(dynamic value) {
    upgradeDto(value, "GooglePhotosImportProgressDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GooglePhotosImportProgressDto(
        albumsFound: num.parse('${json[r'albumsFound']}'),
        current: num.parse('${json[r'current']}'),
        currentFile: mapValueOfType<String>(json, r'currentFile'),
        errors: json[r'errors'] is Iterable
            ? (json[r'errors'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        phase: GooglePhotosImportProgressDtoPhaseEnum.fromJson(json[r'phase'])!,
        photosMatched: num.parse('${json[r'photosMatched']}'),
        photosMissingMetadata: num.parse('${json[r'photosMissingMetadata']}'),
        total: num.parse('${json[r'total']}'),
      );
    }
    return null;
  }

  static List<GooglePhotosImportProgressDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GooglePhotosImportProgressDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GooglePhotosImportProgressDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GooglePhotosImportProgressDto> mapFromJson(dynamic json) {
    final map = <String, GooglePhotosImportProgressDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GooglePhotosImportProgressDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GooglePhotosImportProgressDto-objects as value to a dart map
  static Map<String, List<GooglePhotosImportProgressDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GooglePhotosImportProgressDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GooglePhotosImportProgressDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumsFound',
    'current',
    'errors',
    'phase',
    'photosMatched',
    'photosMissingMetadata',
    'total',
  };
}


class GooglePhotosImportProgressDtoPhaseEnum {
  /// Instantiate a new enum with the provided [value].
  const GooglePhotosImportProgressDtoPhaseEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const extracting = GooglePhotosImportProgressDtoPhaseEnum._(r'extracting');
  static const parsing = GooglePhotosImportProgressDtoPhaseEnum._(r'parsing');
  static const uploading = GooglePhotosImportProgressDtoPhaseEnum._(r'uploading');
  static const complete = GooglePhotosImportProgressDtoPhaseEnum._(r'complete');

  /// List of all possible values in this [enum][GooglePhotosImportProgressDtoPhaseEnum].
  static const values = <GooglePhotosImportProgressDtoPhaseEnum>[
    extracting,
    parsing,
    uploading,
    complete,
  ];

  static GooglePhotosImportProgressDtoPhaseEnum? fromJson(dynamic value) => GooglePhotosImportProgressDtoPhaseEnumTypeTransformer().decode(value);

  static List<GooglePhotosImportProgressDtoPhaseEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GooglePhotosImportProgressDtoPhaseEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GooglePhotosImportProgressDtoPhaseEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GooglePhotosImportProgressDtoPhaseEnum] to String,
/// and [decode] dynamic data back to [GooglePhotosImportProgressDtoPhaseEnum].
class GooglePhotosImportProgressDtoPhaseEnumTypeTransformer {
  factory GooglePhotosImportProgressDtoPhaseEnumTypeTransformer() => _instance ??= const GooglePhotosImportProgressDtoPhaseEnumTypeTransformer._();

  const GooglePhotosImportProgressDtoPhaseEnumTypeTransformer._();

  String encode(GooglePhotosImportProgressDtoPhaseEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a GooglePhotosImportProgressDtoPhaseEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GooglePhotosImportProgressDtoPhaseEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'extracting': return GooglePhotosImportProgressDtoPhaseEnum.extracting;
        case r'parsing': return GooglePhotosImportProgressDtoPhaseEnum.parsing;
        case r'uploading': return GooglePhotosImportProgressDtoPhaseEnum.uploading;
        case r'complete': return GooglePhotosImportProgressDtoPhaseEnum.complete;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [GooglePhotosImportProgressDtoPhaseEnumTypeTransformer] instance.
  static GooglePhotosImportProgressDtoPhaseEnumTypeTransformer? _instance;
}


