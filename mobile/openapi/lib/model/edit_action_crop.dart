//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditActionCrop {
  /// Returns a new [EditActionCrop] instance.
  EditActionCrop({
    required this.action,
    required this.index,
    required this.parameters,
  });

  EditActionType action;

  /// Order of this edit in the sequence
  ///
  /// Minimum value: 0
  num index;

  CropParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditActionCrop &&
    other.action == action &&
    other.index == index &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (index.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'EditActionCrop[action=$action, index=$index, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'index'] = this.index;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [EditActionCrop] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditActionCrop? fromJson(dynamic value) {
    upgradeDto(value, "EditActionCrop");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditActionCrop(
        action: EditActionType.fromJson(json[r'action'])!,
        index: num.parse('${json[r'index']}'),
        parameters: CropParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<EditActionCrop> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditActionCrop>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditActionCrop.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditActionCrop> mapFromJson(dynamic json) {
    final map = <String, EditActionCrop>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditActionCrop.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditActionCrop-objects as value to a dart map
  static Map<String, List<EditActionCrop>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditActionCrop>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditActionCrop.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'index',
    'parameters',
  };
}

