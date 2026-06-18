//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetOcrDeleteV1 {
  /// Returns a new [SyncAssetOcrDeleteV1] instance.
  SyncAssetOcrDeleteV1({
    required this.assetId,
    required this.deletedAt,
    required this.id,
  });

  /// Original asset ID of the deleted OCR entry
  String assetId;

  /// Timestamp when the OCR entry was deleted
  DateTime deletedAt;

  /// Audit row ID of the deleted OCR entry
  String id;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetOcrDeleteV1 &&
    other.assetId == assetId &&
    other.deletedAt == deletedAt &&
    other.id == id;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (deletedAt.hashCode) +
    (id.hashCode);

  @override
  String toString() => 'SyncAssetOcrDeleteV1[assetId=$assetId, deletedAt=$deletedAt, id=$id]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'deletedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? this.deletedAt.millisecondsSinceEpoch
        : this.deletedAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
    return json;
  }

  /// Returns a new [SyncAssetOcrDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetOcrDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetOcrDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetOcrDeleteV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        deletedAt: mapDateTime(json, r'deletedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')!,
        id: mapValueOfType<String>(json, r'id')!,
      );
    }
    return null;
  }

  static List<SyncAssetOcrDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetOcrDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetOcrDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetOcrDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetOcrDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetOcrDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetOcrDeleteV1-objects as value to a dart map
  static Map<String, List<SyncAssetOcrDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetOcrDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetOcrDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'deletedAt',
    'id',
  };
}

