//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AvatarUpdate {
  /// Returns a new [AvatarUpdate] instance.
  AvatarUpdate({
    this.color,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserAvatarColor? color;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AvatarUpdate &&
    other.color == color;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode);

  @override
  String toString() => 'AvatarUpdate[color=$color]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
    return json;
  }

  /// Returns a new [AvatarUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AvatarUpdate? fromJson(dynamic value) {
    upgradeDto(value, "AvatarUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AvatarUpdate(
        color: UserAvatarColor.fromJson(json[r'color']),
      );
    }
    return null;
  }

  static List<AvatarUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AvatarUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AvatarUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AvatarUpdate> mapFromJson(dynamic json) {
    final map = <String, AvatarUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AvatarUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AvatarUpdate-objects as value to a dart map
  static Map<String, List<AvatarUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AvatarUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AvatarUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

