//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChangedAssetsResponseDto {
  /// Returns a new [ChangedAssetsResponseDto] instance.
  ChangedAssetsResponseDto({
    this.deleted = const [],
    required this.needsFullSync,
    this.upserted = const [],
  });

  List<String> deleted;

  bool needsFullSync;

  List<AssetResponseDto> upserted;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChangedAssetsResponseDto &&
     other.deleted == deleted &&
     other.needsFullSync == needsFullSync &&
     other.upserted == upserted;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deleted.hashCode) +
    (needsFullSync.hashCode) +
    (upserted.hashCode);

  @override
  String toString() => 'ChangedAssetsResponseDto[deleted=$deleted, needsFullSync=$needsFullSync, upserted=$upserted]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'deleted'] = this.deleted;
      json[r'needsFullSync'] = this.needsFullSync;
      json[r'upserted'] = this.upserted;
    return json;
  }

  /// Returns a new [ChangedAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChangedAssetsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ChangedAssetsResponseDto(
        deleted: json[r'deleted'] is List
            ? (json[r'deleted'] as List).cast<String>()
            : const [],
        needsFullSync: mapValueOfType<bool>(json, r'needsFullSync')!,
        upserted: AssetResponseDto.listFromJson(json[r'upserted']),
      );
    }
    return null;
  }

  static List<ChangedAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChangedAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChangedAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChangedAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, ChangedAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChangedAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChangedAssetsResponseDto-objects as value to a dart map
  static Map<String, List<ChangedAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChangedAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChangedAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deleted',
    'needsFullSync',
    'upserted',
  };
}

