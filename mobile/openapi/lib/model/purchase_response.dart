//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PurchaseResponse {
  /// Returns a new [PurchaseResponse] instance.
  PurchaseResponse({
    required this.hideBuyButton,
    this.hideUntil,
    required this.showSupportBadge,
  });

  bool hideBuyButton;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? hideUntil;

  bool showSupportBadge;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PurchaseResponse &&
    other.hideBuyButton == hideBuyButton &&
    other.hideUntil == hideUntil &&
    other.showSupportBadge == showSupportBadge;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hideBuyButton.hashCode) +
    (hideUntil == null ? 0 : hideUntil!.hashCode) +
    (showSupportBadge.hashCode);

  @override
  String toString() => 'PurchaseResponse[hideBuyButton=$hideBuyButton, hideUntil=$hideUntil, showSupportBadge=$showSupportBadge]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hideBuyButton'] = this.hideBuyButton;
    if (this.hideUntil != null) {
      json[r'hideUntil'] = this.hideUntil!.toUtc().toIso8601String();
    } else {
    //  json[r'hideUntil'] = null;
    }
      json[r'showSupportBadge'] = this.showSupportBadge;
    return json;
  }

  /// Returns a new [PurchaseResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PurchaseResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PurchaseResponse(
        hideBuyButton: mapValueOfType<bool>(json, r'hideBuyButton')!,
        hideUntil: mapDateTime(json, r'hideUntil', r''),
        showSupportBadge: mapValueOfType<bool>(json, r'showSupportBadge')!,
      );
    }
    return null;
  }

  static List<PurchaseResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PurchaseResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PurchaseResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PurchaseResponse> mapFromJson(dynamic json) {
    final map = <String, PurchaseResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PurchaseResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PurchaseResponse-objects as value to a dart map
  static Map<String, List<PurchaseResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PurchaseResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PurchaseResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hideBuyButton',
    'showSupportBadge',
  };
}

