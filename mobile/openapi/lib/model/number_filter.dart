//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class NumberFilter {
  /// Returns a new [NumberFilter] instance.
  NumberFilter({
    this.eq = const Optional.absent(),
    this.gt = const Optional.absent(),
    this.gte = const Optional.absent(),
    this.in_ = const Optional.present(const []),
    this.lt = const Optional.absent(),
    this.lte = const Optional.absent(),
    this.ne = const Optional.absent(),
    this.notIn = const Optional.present(const []),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> eq;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> gt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> gte;

  Optional<List<num>?> in_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> lt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> lte;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> ne;

  Optional<List<num>?> notIn;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NumberFilter &&
    other.eq == eq &&
    other.gt == gt &&
    other.gte == gte &&
    _deepEquality.equals(other.in_, in_) &&
    other.lt == lt &&
    other.lte == lte &&
    other.ne == ne &&
    _deepEquality.equals(other.notIn, notIn);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eq == null ? 0 : eq!.hashCode) +
    (gt == null ? 0 : gt!.hashCode) +
    (gte == null ? 0 : gte!.hashCode) +
    (in_.hashCode) +
    (lt == null ? 0 : lt!.hashCode) +
    (lte == null ? 0 : lte!.hashCode) +
    (ne == null ? 0 : ne!.hashCode) +
    (notIn.hashCode);

  @override
  String toString() => 'NumberFilter[eq=$eq, gt=$gt, gte=$gte, in_=$in_, lt=$lt, lte=$lte, ne=$ne, notIn=$notIn]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.eq.isPresent) {
      final value = this.eq.value;
      json[r'eq'] = value;
    }
    if (this.gt.isPresent) {
      final value = this.gt.value;
      json[r'gt'] = value;
    }
    if (this.gte.isPresent) {
      final value = this.gte.value;
      json[r'gte'] = value;
    }
    if (this.in_.isPresent) {
      final value = this.in_.value;
      json[r'in'] = value;
    }
    if (this.lt.isPresent) {
      final value = this.lt.value;
      json[r'lt'] = value;
    }
    if (this.lte.isPresent) {
      final value = this.lte.value;
      json[r'lte'] = value;
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

  /// Returns a new [NumberFilter] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static NumberFilter? fromJson(dynamic value) {
    upgradeDto(value, "NumberFilter");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return NumberFilter(
        eq: json.containsKey(r'eq') ? Optional.present(json[r'eq'] == null ? null : num.parse('${json[r'eq']}')) : const Optional.absent(),
        gt: json.containsKey(r'gt') ? Optional.present(json[r'gt'] == null ? null : num.parse('${json[r'gt']}')) : const Optional.absent(),
        gte: json.containsKey(r'gte') ? Optional.present(json[r'gte'] == null ? null : num.parse('${json[r'gte']}')) : const Optional.absent(),
        in_: json.containsKey(r'in') ? Optional.present(json[r'in'] is Iterable
            ? (json[r'in'] as Iterable).cast<num>().toList(growable: false)
            : const []) : const Optional.absent(),
        lt: json.containsKey(r'lt') ? Optional.present(json[r'lt'] == null ? null : num.parse('${json[r'lt']}')) : const Optional.absent(),
        lte: json.containsKey(r'lte') ? Optional.present(json[r'lte'] == null ? null : num.parse('${json[r'lte']}')) : const Optional.absent(),
        ne: json.containsKey(r'ne') ? Optional.present(json[r'ne'] == null ? null : num.parse('${json[r'ne']}')) : const Optional.absent(),
        notIn: json.containsKey(r'notIn') ? Optional.present(json[r'notIn'] is Iterable
            ? (json[r'notIn'] as Iterable).cast<num>().toList(growable: false)
            : const []) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<NumberFilter> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NumberFilter>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NumberFilter.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, NumberFilter> mapFromJson(dynamic json) {
    final map = <String, NumberFilter>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = NumberFilter.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of NumberFilter-objects as value to a dart map
  static Map<String, List<NumberFilter>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<NumberFilter>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = NumberFilter.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

