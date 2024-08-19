//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartSearchEntity {
  /// Returns a new [SmartSearchEntity] instance.
  SmartSearchEntity({
    this.asset,
    required this.assetId,
    this.embedding = const [],
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetEntity? asset;

  String assetId;

  List<num> embedding;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartSearchEntity &&
    other.asset == asset &&
    other.assetId == assetId &&
    _deepEquality.equals(other.embedding, embedding);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset == null ? 0 : asset!.hashCode) +
    (assetId.hashCode) +
    (embedding.hashCode);

  @override
  String toString() => 'SmartSearchEntity[asset=$asset, assetId=$assetId, embedding=$embedding]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
      json[r'assetId'] = this.assetId;
      json[r'embedding'] = this.embedding;
    return json;
  }

  /// Returns a new [SmartSearchEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartSearchEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartSearchEntity(
        asset: AssetEntity.fromJson(json[r'asset']),
        assetId: mapValueOfType<String>(json, r'assetId')!,
        embedding: json[r'embedding'] is Iterable
            ? (json[r'embedding'] as Iterable).cast<num>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SmartSearchEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartSearchEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartSearchEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartSearchEntity> mapFromJson(dynamic json) {
    final map = <String, SmartSearchEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartSearchEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartSearchEntity-objects as value to a dart map
  static Map<String, List<SmartSearchEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartSearchEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartSearchEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'embedding',
  };
}

