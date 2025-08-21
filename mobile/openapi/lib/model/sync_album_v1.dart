//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAlbumV1 {
  /// Returns a new [SyncAlbumV1] instance.
  SyncAlbumV1({
    required this.createdAt,
    required this.description,
    required this.id,
    required this.isActivityEnabled,
    required this.name,
    required this.order,
    required this.ownerId,
    required this.thumbnailAssetId,
    required this.updatedAt,
  });

  DateTime createdAt;

  String description;

  String id;

  bool isActivityEnabled;

  String name;

  AssetOrder order;

  String ownerId;

  String? thumbnailAssetId;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAlbumV1 &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.id == id &&
    other.isActivityEnabled == isActivityEnabled &&
    other.name == name &&
    other.order == order &&
    other.ownerId == ownerId &&
    other.thumbnailAssetId == thumbnailAssetId &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (description.hashCode) +
    (id.hashCode) +
    (isActivityEnabled.hashCode) +
    (name.hashCode) +
    (order.hashCode) +
    (ownerId.hashCode) +
    (thumbnailAssetId == null ? 0 : thumbnailAssetId!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SyncAlbumV1[createdAt=$createdAt, description=$description, id=$id, isActivityEnabled=$isActivityEnabled, name=$name, order=$order, ownerId=$ownerId, thumbnailAssetId=$thumbnailAssetId, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'description'] = this.description;
      json[r'id'] = this.id;
      json[r'isActivityEnabled'] = this.isActivityEnabled;
      json[r'name'] = this.name;
      json[r'order'] = this.order;
      json[r'ownerId'] = this.ownerId;
    if (this.thumbnailAssetId != null) {
      json[r'thumbnailAssetId'] = this.thumbnailAssetId;
    } else {
    //  json[r'thumbnailAssetId'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [SyncAlbumV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAlbumV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAlbumV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAlbumV1(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description')!,
        id: mapValueOfType<String>(json, r'id')!,
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled')!,
        name: mapValueOfType<String>(json, r'name')!,
        order: AssetOrder.fromJson(json[r'order'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbnailAssetId: mapValueOfType<String>(json, r'thumbnailAssetId'),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<SyncAlbumV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAlbumV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAlbumV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAlbumV1> mapFromJson(dynamic json) {
    final map = <String, SyncAlbumV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAlbumV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAlbumV1-objects as value to a dart map
  static Map<String, List<SyncAlbumV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAlbumV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAlbumV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'description',
    'id',
    'isActivityEnabled',
    'name',
    'order',
    'ownerId',
    'thumbnailAssetId',
    'updatedAt',
  };
}

