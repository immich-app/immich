//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncPersonV2 {
  /// Returns a new [SyncPersonV2] instance.
  SyncPersonV2({
    required this.createdAt,
    required this.faceClusterId,
    required this.id,
    required this.isFavorite,
    required this.isHidden,
    required this.ownerId,
    required this.updatedAt,
  });

  /// Created at
  DateTime createdAt;

  /// Face cluster ID
  String faceClusterId;

  /// Person ID
  String id;

  /// Is favorite
  bool isFavorite;

  /// Is hidden
  bool isHidden;

  /// Owner ID
  String ownerId;

  /// Updated at
  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncPersonV2 &&
    other.createdAt == createdAt &&
    other.faceClusterId == faceClusterId &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.ownerId == ownerId &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (faceClusterId.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (isHidden.hashCode) +
    (ownerId.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SyncPersonV2[createdAt=$createdAt, faceClusterId=$faceClusterId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, ownerId=$ownerId, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
      json[r'faceClusterId'] = this.faceClusterId;
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isHidden'] = this.isHidden;
      json[r'ownerId'] = this.ownerId;
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [SyncPersonV2] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncPersonV2? fromJson(dynamic value) {
    upgradeDto(value, "SyncPersonV2");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncPersonV2(
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')!,
        faceClusterId: mapValueOfType<String>(json, r'faceClusterId')!,
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')!,
      );
    }
    return null;
  }

  static List<SyncPersonV2> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncPersonV2>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncPersonV2.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncPersonV2> mapFromJson(dynamic json) {
    final map = <String, SyncPersonV2>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncPersonV2.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncPersonV2-objects as value to a dart map
  static Map<String, List<SyncPersonV2>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncPersonV2>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncPersonV2.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'faceClusterId',
    'id',
    'isFavorite',
    'isHidden',
    'ownerId',
    'updatedAt',
  };
}

