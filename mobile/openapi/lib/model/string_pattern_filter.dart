//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StringPatternFilter {
  /// Returns a new [StringPatternFilter] instance.
  StringPatternFilter({
    this.endsWith = const Optional.absent(),
    this.eq = const Optional.absent(),
    this.in_ = const Optional.present(const []),
    this.like = const Optional.absent(),
    this.ne = const Optional.absent(),
    this.notIn = const Optional.present(const []),
    this.notLike = const Optional.absent(),
    this.startsWith = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> endsWith;

  Optional<String?> eq;

  Optional<List<String>?> in_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> like;

  Optional<String?> ne;

  Optional<List<String>?> notIn;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> notLike;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> startsWith;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StringPatternFilter &&
    other.endsWith == endsWith &&
    other.eq == eq &&
    _deepEquality.equals(other.in_, in_) &&
    other.like == like &&
    other.ne == ne &&
    _deepEquality.equals(other.notIn, notIn) &&
    other.notLike == notLike &&
    other.startsWith == startsWith;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (endsWith == null ? 0 : endsWith!.hashCode) +
    (eq == null ? 0 : eq!.hashCode) +
    (in_.hashCode) +
    (like == null ? 0 : like!.hashCode) +
    (ne == null ? 0 : ne!.hashCode) +
    (notIn.hashCode) +
    (notLike == null ? 0 : notLike!.hashCode) +
    (startsWith == null ? 0 : startsWith!.hashCode);

  @override
  String toString() => 'StringPatternFilter[endsWith=$endsWith, eq=$eq, in_=$in_, like=$like, ne=$ne, notIn=$notIn, notLike=$notLike, startsWith=$startsWith]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.endsWith.isPresent) {
      final value = this.endsWith.value;
      json[r'endsWith'] = value;
    }
    if (this.eq.isPresent) {
      final value = this.eq.value;
      json[r'eq'] = value;
    }
    if (this.in_.isPresent) {
      final value = this.in_.value;
      json[r'in'] = value;
    }
    if (this.like.isPresent) {
      final value = this.like.value;
      json[r'like'] = value;
    }
    if (this.ne.isPresent) {
      final value = this.ne.value;
      json[r'ne'] = value;
    }
    if (this.notIn.isPresent) {
      final value = this.notIn.value;
      json[r'notIn'] = value;
    }
    if (this.notLike.isPresent) {
      final value = this.notLike.value;
      json[r'notLike'] = value;
    }
    if (this.startsWith.isPresent) {
      final value = this.startsWith.value;
      json[r'startsWith'] = value;
    }
    return json;
  }

  /// Returns a new [StringPatternFilter] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StringPatternFilter? fromJson(dynamic value) {
    upgradeDto(value, "StringPatternFilter");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StringPatternFilter(
        endsWith: json.containsKey(r'endsWith') ? Optional.present(mapValueOfType<String>(json, r'endsWith')) : const Optional.absent(),
        eq: json.containsKey(r'eq') ? Optional.present(mapValueOfType<String>(json, r'eq')) : const Optional.absent(),
        in_: json.containsKey(r'in') ? Optional.present(json[r'in'] is Iterable
            ? (json[r'in'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        like: json.containsKey(r'like') ? Optional.present(mapValueOfType<String>(json, r'like')) : const Optional.absent(),
        ne: json.containsKey(r'ne') ? Optional.present(mapValueOfType<String>(json, r'ne')) : const Optional.absent(),
        notIn: json.containsKey(r'notIn') ? Optional.present(json[r'notIn'] is Iterable
            ? (json[r'notIn'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        notLike: json.containsKey(r'notLike') ? Optional.present(mapValueOfType<String>(json, r'notLike')) : const Optional.absent(),
        startsWith: json.containsKey(r'startsWith') ? Optional.present(mapValueOfType<String>(json, r'startsWith')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<StringPatternFilter> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StringPatternFilter>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StringPatternFilter.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StringPatternFilter> mapFromJson(dynamic json) {
    final map = <String, StringPatternFilter>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StringPatternFilter.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StringPatternFilter-objects as value to a dart map
  static Map<String, List<StringPatternFilter>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StringPatternFilter>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StringPatternFilter.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

