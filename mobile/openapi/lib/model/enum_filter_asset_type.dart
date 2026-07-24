//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EnumFilterAssetType {
  /// Returns a new [EnumFilterAssetType] instance.
  EnumFilterAssetType({
    this.eq = const Optional.absent(),
    this.in_ = const Optional.present(const []),
    this.ne = const Optional.absent(),
    this.notIn = const Optional.present(const []),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetTypeEnum?> eq;

  Optional<List<AssetTypeEnum>?> in_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetTypeEnum?> ne;

  Optional<List<AssetTypeEnum>?> notIn;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EnumFilterAssetType &&
    other.eq == eq &&
    _deepEquality.equals(other.in_, in_) &&
    other.ne == ne &&
    _deepEquality.equals(other.notIn, notIn);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eq == null ? 0 : eq!.hashCode) +
    (in_.hashCode) +
    (ne == null ? 0 : ne!.hashCode) +
    (notIn.hashCode);

  @override
  String toString() => 'EnumFilterAssetType[eq=$eq, in_=$in_, ne=$ne, notIn=$notIn]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.eq.isPresent) {
      final value = this.eq.value;
      json[r'eq'] = value;
    }
    if (this.in_.isPresent) {
      final value = this.in_.value;
      json[r'in'] = value;
    }
    if (this.ne.isPresent) {
      final value = this.ne.value;
      json[r'ne'] = value;
    }
    if (this.notIn.isPresent) {
      final value = this.notIn.value;
      json[r'notIn'] = value;
    }
    return json;
  }

  /// Returns a new [EnumFilterAssetType] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EnumFilterAssetType? fromJson(dynamic value) {
    upgradeDto(value, "EnumFilterAssetType");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EnumFilterAssetType(
        eq: json.containsKey(r'eq') ? Optional.present(AssetTypeEnum.fromJson(json[r'eq'])) : const Optional.absent(),
        in_: json.containsKey(r'in') ? Optional.present(AssetTypeEnum.listFromJson(json[r'in'])) : const Optional.absent(),
        ne: json.containsKey(r'ne') ? Optional.present(AssetTypeEnum.fromJson(json[r'ne'])) : const Optional.absent(),
        notIn: json.containsKey(r'notIn') ? Optional.present(AssetTypeEnum.listFromJson(json[r'notIn'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<EnumFilterAssetType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EnumFilterAssetType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EnumFilterAssetType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EnumFilterAssetType> mapFromJson(dynamic json) {
    final map = <String, EnumFilterAssetType>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EnumFilterAssetType.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EnumFilterAssetType-objects as value to a dart map
  static Map<String, List<EnumFilterAssetType>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EnumFilterAssetType>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EnumFilterAssetType.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

