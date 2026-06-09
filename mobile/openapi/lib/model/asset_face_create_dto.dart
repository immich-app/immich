//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceCreateDto {
  /// Returns a new [AssetFaceCreateDto] instance.
  AssetFaceCreateDto({
    required this.assetId,
    required this.height,
    required this.imageHeight,
    required this.imageWidth,
    required this.personId,
    required this.width,
    required this.x,
    required this.y,
  });

  /// Asset ID
  String assetId;

  /// Face bounding box height
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int height;

  /// Image height in pixels
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int imageHeight;

  /// Image width in pixels
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int imageWidth;

  /// Person ID
  String personId;

  /// Face bounding box width
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int width;

  /// Face bounding box X coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int x;

  /// Face bounding box Y coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int y;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceCreateDto &&
    other.assetId == assetId &&
    other.height == height &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.personId == personId &&
    other.width == width &&
    other.x == x &&
    other.y == y;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (height.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (personId.hashCode) +
    (width.hashCode) +
    (x.hashCode) +
    (y.hashCode);

  @override
  String toString() => 'AssetFaceCreateDto[assetId=$assetId, height=$height, imageHeight=$imageHeight, imageWidth=$imageWidth, personId=$personId, width=$width, x=$x, y=$y]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'height'] = this.height;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
      json[r'personId'] = this.personId;
      json[r'width'] = this.width;
      json[r'x'] = this.x;
      json[r'y'] = this.y;
    return json;
  }

  /// Returns a new [AssetFaceCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceCreateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'assetId'), 'Required key "AssetFaceCreateDto[assetId]" is missing from JSON.');
        assert(json[r'assetId'] != null, 'Required key "AssetFaceCreateDto[assetId]" has a null value in JSON.');
        assert(json.containsKey(r'height'), 'Required key "AssetFaceCreateDto[height]" is missing from JSON.');
        assert(json[r'height'] != null, 'Required key "AssetFaceCreateDto[height]" has a null value in JSON.');
        assert(json.containsKey(r'imageHeight'), 'Required key "AssetFaceCreateDto[imageHeight]" is missing from JSON.');
        assert(json[r'imageHeight'] != null, 'Required key "AssetFaceCreateDto[imageHeight]" has a null value in JSON.');
        assert(json.containsKey(r'imageWidth'), 'Required key "AssetFaceCreateDto[imageWidth]" is missing from JSON.');
        assert(json[r'imageWidth'] != null, 'Required key "AssetFaceCreateDto[imageWidth]" has a null value in JSON.');
        assert(json.containsKey(r'personId'), 'Required key "AssetFaceCreateDto[personId]" is missing from JSON.');
        assert(json[r'personId'] != null, 'Required key "AssetFaceCreateDto[personId]" has a null value in JSON.');
        assert(json.containsKey(r'width'), 'Required key "AssetFaceCreateDto[width]" is missing from JSON.');
        assert(json[r'width'] != null, 'Required key "AssetFaceCreateDto[width]" has a null value in JSON.');
        assert(json.containsKey(r'x'), 'Required key "AssetFaceCreateDto[x]" is missing from JSON.');
        assert(json[r'x'] != null, 'Required key "AssetFaceCreateDto[x]" has a null value in JSON.');
        assert(json.containsKey(r'y'), 'Required key "AssetFaceCreateDto[y]" is missing from JSON.');
        assert(json[r'y'] != null, 'Required key "AssetFaceCreateDto[y]" has a null value in JSON.');
        return true;
      }());

      return AssetFaceCreateDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        height: mapValueOfType<int>(json, r'height')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        personId: mapValueOfType<String>(json, r'personId')!,
        width: mapValueOfType<int>(json, r'width')!,
        x: mapValueOfType<int>(json, r'x')!,
        y: mapValueOfType<int>(json, r'y')!,
      );
    }
    return null;
  }

  static List<AssetFaceCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceCreateDto> mapFromJson(dynamic json) {
    final map = <String, AssetFaceCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceCreateDto-objects as value to a dart map
  static Map<String, List<AssetFaceCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'height',
    'imageHeight',
    'imageWidth',
    'personId',
    'width',
    'x',
    'y',
  };
}

