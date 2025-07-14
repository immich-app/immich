//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncStreamDto {
  /// Returns a new [SyncStreamDto] instance.
  SyncStreamDto({
    this.reset,
    this.types = const [],
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? reset;

  List<SyncRequestType> types;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncStreamDto &&
    other.reset == reset &&
    _deepEquality.equals(other.types, types);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (reset == null ? 0 : reset!.hashCode) +
    (types.hashCode);

  @override
  String toString() => 'SyncStreamDto[reset=$reset, types=$types]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.reset != null) {
      json[r'reset'] = this.reset;
    } else {
    //  json[r'reset'] = null;
    }
      json[r'types'] = this.types;
    return json;
  }

  /// Returns a new [SyncStreamDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncStreamDto? fromJson(dynamic value) {
    upgradeDto(value, "SyncStreamDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncStreamDto(
        reset: mapValueOfType<bool>(json, r'reset'),
        types: SyncRequestType.listFromJson(json[r'types']),
      );
    }
    return null;
  }

  static List<SyncStreamDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStreamDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStreamDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncStreamDto> mapFromJson(dynamic json) {
    final map = <String, SyncStreamDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncStreamDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncStreamDto-objects as value to a dart map
  static Map<String, List<SyncStreamDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncStreamDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncStreamDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'types',
  };
}

