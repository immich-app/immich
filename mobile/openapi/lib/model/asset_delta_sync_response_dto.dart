//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetDeltaSyncResponseDto {
  /// Returns a new [AssetDeltaSyncResponseDto] instance.
  AssetDeltaSyncResponseDto({
    this.deleted = const [],
    required this.needsFullSync,
    this.upserted = const [],
  });

  List<String> deleted;

  bool needsFullSync;

  List<AssetResponseDto> upserted;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetDeltaSyncResponseDto &&
    _deepEquality.equals(other.deleted, deleted) &&
    other.needsFullSync == needsFullSync &&
    _deepEquality.equals(other.upserted, upserted);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deleted.hashCode) +
    (needsFullSync.hashCode) +
    (upserted.hashCode);

  @override
  String toString() => 'AssetDeltaSyncResponseDto[deleted=$deleted, needsFullSync=$needsFullSync, upserted=$upserted]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'deleted'] = this.deleted;
      json[r'needsFullSync'] = this.needsFullSync;
      json[r'upserted'] = this.upserted;
    return json;
  }

  /// Returns a new [AssetDeltaSyncResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetDeltaSyncResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetDeltaSyncResponseDto(
        deleted: json[r'deleted'] is Iterable
            ? (json[r'deleted'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        needsFullSync: mapValueOfType<bool>(json, r'needsFullSync')!,
        upserted: AssetResponseDto.listFromJson(json[r'upserted']),
      );
    }
    return null;
  }

  static List<AssetDeltaSyncResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetDeltaSyncResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetDeltaSyncResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetDeltaSyncResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetDeltaSyncResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetDeltaSyncResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetDeltaSyncResponseDto-objects as value to a dart map
  static Map<String, List<AssetDeltaSyncResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetDeltaSyncResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetDeltaSyncResponseDto.listFromJson(entry.value, growable: growable,);
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

