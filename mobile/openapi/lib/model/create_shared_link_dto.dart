//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateSharedLinkDto {
  /// Returns a new [CreateSharedLinkDto] instance.
  CreateSharedLinkDto({
    required this.sharedType,
    this.assetIds = const [],
    this.description,
    this.expiredAt,
    required this.albumId,
  });

  SharedLinkType sharedType;

  List<String> assetIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? expiredAt;

  String albumId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateSharedLinkDto &&
     other.sharedType == sharedType &&
     other.assetIds == assetIds &&
     other.description == description &&
     other.expiredAt == expiredAt &&
     other.albumId == albumId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sharedType.hashCode) +
    (assetIds.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiredAt == null ? 0 : expiredAt!.hashCode) +
    (albumId.hashCode);

  @override
  String toString() => 'CreateSharedLinkDto[sharedType=$sharedType, assetIds=$assetIds, description=$description, expiredAt=$expiredAt, albumId=$albumId]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'sharedType'] = sharedType;
      _json[r'assetIds'] = assetIds;
    if (description != null) {
      _json[r'description'] = description;
    } else {
      _json[r'description'] = null;
    }
    if (expiredAt != null) {
      _json[r'expiredAt'] = expiredAt;
    } else {
      _json[r'expiredAt'] = null;
    }
      _json[r'albumId'] = albumId;
    return _json;
  }

  /// Returns a new [CreateSharedLinkDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateSharedLinkDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CreateSharedLinkDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CreateSharedLinkDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CreateSharedLinkDto(
        sharedType: SharedLinkType.fromJson(json[r'sharedType'])!,
        assetIds: json[r'assetIds'] is List
            ? (json[r'assetIds'] as List).cast<String>()
            : const [],
        description: mapValueOfType<String>(json, r'description'),
        expiredAt: mapValueOfType<String>(json, r'expiredAt'),
        albumId: mapValueOfType<String>(json, r'albumId')!,
      );
    }
    return null;
  }

  static List<CreateSharedLinkDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateSharedLinkDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateSharedLinkDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateSharedLinkDto> mapFromJson(dynamic json) {
    final map = <String, CreateSharedLinkDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateSharedLinkDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateSharedLinkDto-objects as value to a dart map
  static Map<String, List<CreateSharedLinkDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateSharedLinkDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateSharedLinkDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sharedType',
    'assetIds',
    'albumId',
  };
}

