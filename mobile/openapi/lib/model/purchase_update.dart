//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PurchaseUpdate {
  /// Returns a new [PurchaseUpdate] instance.
  PurchaseUpdate({
    this.hideBuyButtonForever,
    this.lastTimeHide,
    this.showPurchaseInfo,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? hideBuyButtonForever;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastTimeHide;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showPurchaseInfo;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PurchaseUpdate &&
    other.hideBuyButtonForever == hideBuyButtonForever &&
    other.lastTimeHide == lastTimeHide &&
    other.showPurchaseInfo == showPurchaseInfo;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hideBuyButtonForever == null ? 0 : hideBuyButtonForever!.hashCode) +
    (lastTimeHide == null ? 0 : lastTimeHide!.hashCode) +
    (showPurchaseInfo == null ? 0 : showPurchaseInfo!.hashCode);

  @override
  String toString() => 'PurchaseUpdate[hideBuyButtonForever=$hideBuyButtonForever, lastTimeHide=$lastTimeHide, showPurchaseInfo=$showPurchaseInfo]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.hideBuyButtonForever != null) {
      json[r'hideBuyButtonForever'] = this.hideBuyButtonForever;
    } else {
    //  json[r'hideBuyButtonForever'] = null;
    }
    if (this.lastTimeHide != null) {
      json[r'lastTimeHide'] = this.lastTimeHide!.toUtc().toIso8601String();
    } else {
    //  json[r'lastTimeHide'] = null;
    }
    if (this.showPurchaseInfo != null) {
      json[r'showPurchaseInfo'] = this.showPurchaseInfo;
    } else {
    //  json[r'showPurchaseInfo'] = null;
    }
    return json;
  }

  /// Returns a new [PurchaseUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PurchaseUpdate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PurchaseUpdate(
        hideBuyButtonForever: mapValueOfType<bool>(json, r'hideBuyButtonForever'),
        lastTimeHide: mapDateTime(json, r'lastTimeHide', r''),
        showPurchaseInfo: mapValueOfType<bool>(json, r'showPurchaseInfo'),
      );
    }
    return null;
  }

  static List<PurchaseUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PurchaseUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PurchaseUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PurchaseUpdate> mapFromJson(dynamic json) {
    final map = <String, PurchaseUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PurchaseUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PurchaseUpdate-objects as value to a dart map
  static Map<String, List<PurchaseUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PurchaseUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PurchaseUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

