//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BackendDto {
  /// Returns a new [BackendDto] instance.
  BackendDto({
    required this.description,
    this.error = const Optional.absent(),
    required this.id,
    required this.isOnline,
    required this.type,
  });

  String description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> error;

  String id;

  bool isOnline;

  BackendType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BackendDto &&
    other.description == description &&
    other.error == error &&
    other.id == id &&
    other.isOnline == isOnline &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (id.hashCode) +
    (isOnline.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'BackendDto[description=$description, error=$error, id=$id, isOnline=$isOnline, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
    if (this.error.isPresent) {
      final value = this.error.value;
      json[r'error'] = value;
    }
      json[r'id'] = this.id;
      json[r'isOnline'] = this.isOnline;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [BackendDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BackendDto? fromJson(dynamic value) {
    upgradeDto(value, "BackendDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BackendDto(
        description: mapValueOfType<String>(json, r'description')!,
        error: json.containsKey(r'error') ? Optional.present(mapValueOfType<String>(json, r'error')) : const Optional.absent(),
        id: mapValueOfType<String>(json, r'id')!,
        isOnline: mapValueOfType<bool>(json, r'isOnline')!,
        type: BackendType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<BackendDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BackendDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BackendDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BackendDto> mapFromJson(dynamic json) {
    final map = <String, BackendDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BackendDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BackendDto-objects as value to a dart map
  static Map<String, List<BackendDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BackendDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BackendDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'id',
    'isOnline',
    'type',
  };
}

