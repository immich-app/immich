//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncFaceClusterV1 {
  /// Returns a new [SyncFaceClusterV1] instance.
  SyncFaceClusterV1({
    required this.birthDate,
    required this.createdAt,
    required this.featureFaceAssetId,
    required this.id,
    required this.name,
    required this.updatedAt,
  });

  /// Birth date
  DateTime? birthDate;

  /// Created at
  DateTime createdAt;

  /// Feature face asset ID
  String? featureFaceAssetId;

  /// Face cluster ID
  String id;

  /// Name
  String name;

  /// Updated at
  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncFaceClusterV1 &&
    other.birthDate == birthDate &&
    other.createdAt == createdAt &&
    other.featureFaceAssetId == featureFaceAssetId &&
    other.id == id &&
    other.name == name &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (createdAt.hashCode) +
    (featureFaceAssetId == null ? 0 : featureFaceAssetId!.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SyncFaceClusterV1[birthDate=$birthDate, createdAt=$createdAt, featureFaceAssetId=$featureFaceAssetId, id=$id, name=$name, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.birthDate!.millisecondsSinceEpoch
        : this.birthDate!.toUtc().toIso8601String();
    } else {
      json[r'birthDate'] = null;
    }
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
    if (this.featureFaceAssetId != null) {
      json[r'featureFaceAssetId'] = this.featureFaceAssetId;
    } else {
      json[r'featureFaceAssetId'] = null;
    }
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [SyncFaceClusterV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncFaceClusterV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncFaceClusterV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncFaceClusterV1(
        birthDate: mapDateTime(json, r'birthDate', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/'),
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')!,
        featureFaceAssetId: mapValueOfType<String>(json, r'featureFaceAssetId'),
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')!,
      );
    }
    return null;
  }

  static List<SyncFaceClusterV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncFaceClusterV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncFaceClusterV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncFaceClusterV1> mapFromJson(dynamic json) {
    final map = <String, SyncFaceClusterV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncFaceClusterV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncFaceClusterV1-objects as value to a dart map
  static Map<String, List<SyncFaceClusterV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncFaceClusterV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncFaceClusterV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'createdAt',
    'featureFaceAssetId',
    'id',
    'name',
    'updatedAt',
  };
}

