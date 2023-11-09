//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ExpandedPersonResponseDto {
  /// Returns a new [ExpandedPersonResponseDto] instance.
  ExpandedPersonResponseDto({
    required this.birthDate,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    required this.x1,
    required this.x2,
    required this.y1,
    required this.y2,
  });

  DateTime? birthDate;

  String id;

  num imageHeight;

  num imageWidth;

  bool isHidden;

  String name;

  String thumbnailPath;

  num x1;

  num x2;

  num y1;

  num y2;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExpandedPersonResponseDto &&
     other.birthDate == birthDate &&
     other.id == id &&
     other.imageHeight == imageHeight &&
     other.imageWidth == imageWidth &&
     other.isHidden == isHidden &&
     other.name == name &&
     other.thumbnailPath == thumbnailPath &&
     other.x1 == x1 &&
     other.x2 == x2 &&
     other.y1 == y1 &&
     other.y2 == y2;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (thumbnailPath.hashCode) +
    (x1.hashCode) +
    (x2.hashCode) +
    (y1.hashCode) +
    (y2.hashCode);

  @override
  String toString() => 'ExpandedPersonResponseDto[birthDate=$birthDate, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, isHidden=$isHidden, name=$name, thumbnailPath=$thumbnailPath, x1=$x1, x2=$x2, y1=$y1, y2=$y2]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
      json[r'thumbnailPath'] = this.thumbnailPath;
      json[r'x1'] = this.x1;
      json[r'x2'] = this.x2;
      json[r'y1'] = this.y1;
      json[r'y2'] = this.y2;
    return json;
  }

  /// Returns a new [ExpandedPersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExpandedPersonResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExpandedPersonResponseDto(
        birthDate: mapDateTime(json, r'birthDate', ''),
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: json[r'imageHeight'] == null
            ? null
            : num.parse(json[r'imageHeight'].toString()),
        imageWidth: json[r'imageWidth'] == null
            ? null
            : num.parse(json[r'imageWidth'].toString()),
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        x1: json[r'x1'] == null
            ? null
            : num.parse(json[r'x1'].toString()),
        x2: json[r'x2'] == null
            ? null
            : num.parse(json[r'x2'].toString()),
        y1: json[r'y1'] == null
            ? null
            : num.parse(json[r'y1'].toString()),
        y2: json[r'y2'] == null
            ? null
            : num.parse(json[r'y2'].toString()),
      );
    }
    return null;
  }

  static List<ExpandedPersonResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExpandedPersonResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExpandedPersonResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ExpandedPersonResponseDto> mapFromJson(dynamic json) {
    final map = <String, ExpandedPersonResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExpandedPersonResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ExpandedPersonResponseDto-objects as value to a dart map
  static Map<String, List<ExpandedPersonResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ExpandedPersonResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ExpandedPersonResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'id',
    'imageHeight',
    'imageWidth',
    'isHidden',
    'name',
    'thumbnailPath',
    'x1',
    'x2',
    'y1',
    'y2',
  };
}

