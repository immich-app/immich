//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetOcrResponseDto {
  /// Returns a new [AssetOcrResponseDto] instance.
  AssetOcrResponseDto({
    required this.assetId,
    required this.boxScore,
    required this.id,
    required this.text,
    required this.textScore,
    required this.x1,
    required this.x2,
    required this.x3,
    required this.x4,
    required this.y1,
    required this.y2,
    required this.y3,
    required this.y4,
  });

  String assetId;

  /// Confidence score for text detection box
  double boxScore;

  String id;

  /// Recognized text
  String text;

  /// Confidence score for text recognition
  double textScore;

  /// Normalized x coordinate of box corner 1 (0-1)
  double x1;

  /// Normalized x coordinate of box corner 2 (0-1)
  double x2;

  /// Normalized x coordinate of box corner 3 (0-1)
  double x3;

  /// Normalized x coordinate of box corner 4 (0-1)
  double x4;

  /// Normalized y coordinate of box corner 1 (0-1)
  double y1;

  /// Normalized y coordinate of box corner 2 (0-1)
  double y2;

  /// Normalized y coordinate of box corner 3 (0-1)
  double y3;

  /// Normalized y coordinate of box corner 4 (0-1)
  double y4;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetOcrResponseDto &&
    other.assetId == assetId &&
    other.boxScore == boxScore &&
    other.id == id &&
    other.text == text &&
    other.textScore == textScore &&
    other.x1 == x1 &&
    other.x2 == x2 &&
    other.x3 == x3 &&
    other.x4 == x4 &&
    other.y1 == y1 &&
    other.y2 == y2 &&
    other.y3 == y3 &&
    other.y4 == y4;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (boxScore.hashCode) +
    (id.hashCode) +
    (text.hashCode) +
    (textScore.hashCode) +
    (x1.hashCode) +
    (x2.hashCode) +
    (x3.hashCode) +
    (x4.hashCode) +
    (y1.hashCode) +
    (y2.hashCode) +
    (y3.hashCode) +
    (y4.hashCode);

  @override
  String toString() => 'AssetOcrResponseDto[assetId=$assetId, boxScore=$boxScore, id=$id, text=$text, textScore=$textScore, x1=$x1, x2=$x2, x3=$x3, x4=$x4, y1=$y1, y2=$y2, y3=$y3, y4=$y4]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'boxScore'] = this.boxScore;
      json[r'id'] = this.id;
      json[r'text'] = this.text;
      json[r'textScore'] = this.textScore;
      json[r'x1'] = this.x1;
      json[r'x2'] = this.x2;
      json[r'x3'] = this.x3;
      json[r'x4'] = this.x4;
      json[r'y1'] = this.y1;
      json[r'y2'] = this.y2;
      json[r'y3'] = this.y3;
      json[r'y4'] = this.y4;
    return json;
  }

  /// Returns a new [AssetOcrResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetOcrResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'assetId'), 'Required key "AssetOcrResponseDto[assetId]" is missing from JSON.');
        assert(json[r'assetId'] != null, 'Required key "AssetOcrResponseDto[assetId]" has a null value in JSON.');
        assert(json.containsKey(r'boxScore'), 'Required key "AssetOcrResponseDto[boxScore]" is missing from JSON.');
        assert(json[r'boxScore'] != null, 'Required key "AssetOcrResponseDto[boxScore]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "AssetOcrResponseDto[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "AssetOcrResponseDto[id]" has a null value in JSON.');
        assert(json.containsKey(r'text'), 'Required key "AssetOcrResponseDto[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "AssetOcrResponseDto[text]" has a null value in JSON.');
        assert(json.containsKey(r'textScore'), 'Required key "AssetOcrResponseDto[textScore]" is missing from JSON.');
        assert(json[r'textScore'] != null, 'Required key "AssetOcrResponseDto[textScore]" has a null value in JSON.');
        assert(json.containsKey(r'x1'), 'Required key "AssetOcrResponseDto[x1]" is missing from JSON.');
        assert(json[r'x1'] != null, 'Required key "AssetOcrResponseDto[x1]" has a null value in JSON.');
        assert(json.containsKey(r'x2'), 'Required key "AssetOcrResponseDto[x2]" is missing from JSON.');
        assert(json[r'x2'] != null, 'Required key "AssetOcrResponseDto[x2]" has a null value in JSON.');
        assert(json.containsKey(r'x3'), 'Required key "AssetOcrResponseDto[x3]" is missing from JSON.');
        assert(json[r'x3'] != null, 'Required key "AssetOcrResponseDto[x3]" has a null value in JSON.');
        assert(json.containsKey(r'x4'), 'Required key "AssetOcrResponseDto[x4]" is missing from JSON.');
        assert(json[r'x4'] != null, 'Required key "AssetOcrResponseDto[x4]" has a null value in JSON.');
        assert(json.containsKey(r'y1'), 'Required key "AssetOcrResponseDto[y1]" is missing from JSON.');
        assert(json[r'y1'] != null, 'Required key "AssetOcrResponseDto[y1]" has a null value in JSON.');
        assert(json.containsKey(r'y2'), 'Required key "AssetOcrResponseDto[y2]" is missing from JSON.');
        assert(json[r'y2'] != null, 'Required key "AssetOcrResponseDto[y2]" has a null value in JSON.');
        assert(json.containsKey(r'y3'), 'Required key "AssetOcrResponseDto[y3]" is missing from JSON.');
        assert(json[r'y3'] != null, 'Required key "AssetOcrResponseDto[y3]" has a null value in JSON.');
        assert(json.containsKey(r'y4'), 'Required key "AssetOcrResponseDto[y4]" is missing from JSON.');
        assert(json[r'y4'] != null, 'Required key "AssetOcrResponseDto[y4]" has a null value in JSON.');
        return true;
      }());

      return AssetOcrResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        boxScore: mapValueOfType<double>(json, r'boxScore')!,
        id: mapValueOfType<String>(json, r'id')!,
        text: mapValueOfType<String>(json, r'text')!,
        textScore: mapValueOfType<double>(json, r'textScore')!,
        x1: mapValueOfType<double>(json, r'x1')!,
        x2: mapValueOfType<double>(json, r'x2')!,
        x3: mapValueOfType<double>(json, r'x3')!,
        x4: mapValueOfType<double>(json, r'x4')!,
        y1: mapValueOfType<double>(json, r'y1')!,
        y2: mapValueOfType<double>(json, r'y2')!,
        y3: mapValueOfType<double>(json, r'y3')!,
        y4: mapValueOfType<double>(json, r'y4')!,
      );
    }
    return null;
  }

  static List<AssetOcrResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetOcrResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetOcrResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetOcrResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetOcrResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetOcrResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetOcrResponseDto-objects as value to a dart map
  static Map<String, List<AssetOcrResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetOcrResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetOcrResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'boxScore',
    'id',
    'text',
    'textScore',
    'x1',
    'x2',
    'x3',
    'x4',
    'y1',
    'y2',
    'y3',
    'y4',
  };
}

