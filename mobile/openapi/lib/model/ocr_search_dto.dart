//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OcrSearchDto {
  /// Returns a new [OcrSearchDto] instance.
  OcrSearchDto({
    this.ocr,
  });

  String? ocr;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OcrSearchDto &&
          other.ocr == ocr;

  @override
  int get hashCode => ocr.hashCode;

  @override
  String toString() => 'OcrSearchDto[ocr=$ocr]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.ocr != null) {
      json[r'ocr'] = this.ocr;
    } else {
      //  json[r'ocr'] = null;
    }
    return json;
  }

  static OcrSearchDto fromJson(Map<String, dynamic> json) {
    return OcrSearchDto.fromJson(json);
  }

  static List<OcrSearchDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OcrSearchDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OcrSearchDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OcrSearchDto> mapFromJson(dynamic json) {
    final map = <String, OcrSearchDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OcrSearchDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OcrSearchDto-objects as value to a dart map
  static Map<String, List<OcrSearchDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OcrSearchDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OcrSearchDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ocr',
  };
}
