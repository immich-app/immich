//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FaceSearchEntity {
  /// Returns a new [FaceSearchEntity] instance.
  FaceSearchEntity({
    this.embedding = const [],
    this.face,
    required this.faceId,
  });

  List<num> embedding;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetFaceEntity? face;

  String faceId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FaceSearchEntity &&
    _deepEquality.equals(other.embedding, embedding) &&
    other.face == face &&
    other.faceId == faceId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (embedding.hashCode) +
    (face == null ? 0 : face!.hashCode) +
    (faceId.hashCode);

  @override
  String toString() => 'FaceSearchEntity[embedding=$embedding, face=$face, faceId=$faceId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'embedding'] = this.embedding;
    if (this.face != null) {
      json[r'face'] = this.face;
    } else {
    //  json[r'face'] = null;
    }
      json[r'faceId'] = this.faceId;
    return json;
  }

  /// Returns a new [FaceSearchEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FaceSearchEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FaceSearchEntity(
        embedding: json[r'embedding'] is Iterable
            ? (json[r'embedding'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        face: AssetFaceEntity.fromJson(json[r'face']),
        faceId: mapValueOfType<String>(json, r'faceId')!,
      );
    }
    return null;
  }

  static List<FaceSearchEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FaceSearchEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FaceSearchEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FaceSearchEntity> mapFromJson(dynamic json) {
    final map = <String, FaceSearchEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FaceSearchEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FaceSearchEntity-objects as value to a dart map
  static Map<String, List<FaceSearchEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FaceSearchEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FaceSearchEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'embedding',
    'faceId',
  };
}

