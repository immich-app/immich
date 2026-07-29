//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IdsFilter {
  /// Returns a new [IdsFilter] instance.
  IdsFilter({
    this.all = const Optional.present(const []),
    this.any = const Optional.present(const []),
    this.none = const Optional.present(const []),
  });

  Optional<List<String>?> all;

  Optional<List<String>?> any;

  Optional<List<String>?> none;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IdsFilter &&
    _deepEquality.equals(other.all, all) &&
    _deepEquality.equals(other.any, any) &&
    _deepEquality.equals(other.none, none);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (all.hashCode) +
    (any.hashCode) +
    (none.hashCode);

  @override
  String toString() => 'IdsFilter[all=$all, any=$any, none=$none]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.all.isPresent) {
      final value = this.all.value;
      json[r'all'] = value;
    }
    if (this.any.isPresent) {
      final value = this.any.value;
      json[r'any'] = value;
    }
    if (this.none.isPresent) {
      final value = this.none.value;
      json[r'none'] = value;
    }
    return json;
  }

  /// Returns a new [IdsFilter] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IdsFilter? fromJson(dynamic value) {
    upgradeDto(value, "IdsFilter");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IdsFilter(
        all: json.containsKey(r'all') ? Optional.present(json[r'all'] is Iterable
            ? (json[r'all'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        any: json.containsKey(r'any') ? Optional.present(json[r'any'] is Iterable
            ? (json[r'any'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        none: json.containsKey(r'none') ? Optional.present(json[r'none'] is Iterable
            ? (json[r'none'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<IdsFilter> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IdsFilter>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IdsFilter.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IdsFilter> mapFromJson(dynamic json) {
    final map = <String, IdsFilter>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IdsFilter.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IdsFilter-objects as value to a dart map
  static Map<String, List<IdsFilter>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IdsFilter>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IdsFilter.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

