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
    required this.hideBuyButtonUntil,
    required this.showSupportBadge,
  });

  String hideBuyButtonUntil;

  bool showSupportBadge;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PurchaseResponse &&
    other.hideBuyButtonUntil == hideBuyButtonUntil &&
    other.showSupportBadge == showSupportBadge;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hideBuyButtonUntil.hashCode) +
    (showSupportBadge.hashCode);

  @override
  String toString() => 'PurchaseResponse[hideBuyButtonUntil=$hideBuyButtonUntil, showSupportBadge=$showSupportBadge]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hideBuyButtonUntil'] = this.hideBuyButtonUntil;
      json[r'showSupportBadge'] = this.showSupportBadge;
    return json;
  }

  /// Returns a new [PurchaseResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PurchaseResponse? fromJson(dynamic value) {
    upgradeDto(value, "PurchaseResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PurchaseResponse(
        hideBuyButtonUntil: mapValueOfType<String>(json, r'hideBuyButtonUntil')!,
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
    'hideBuyButtonUntil',
    'showSupportBadge',
  };
}

