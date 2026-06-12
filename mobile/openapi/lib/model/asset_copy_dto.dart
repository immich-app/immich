//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCopyDto {
  /// Returns a new [AssetCopyDto] instance.
  AssetCopyDto({
    this.albums = const Optional.present(true),
    this.favorite = const Optional.present(true),
    this.sharedLinks = const Optional.present(true),
    this.sidecar = const Optional.present(true),
    required this.sourceId,
    this.stack = const Optional.present(true),
    required this.targetId,
  });

  /// Copy album associations
  Optional<bool?> albums;

  /// Copy favorite status
  Optional<bool?> favorite;

  /// Copy shared links
  Optional<bool?> sharedLinks;

  /// Copy sidecar file
  Optional<bool?> sidecar;

  /// Source asset ID
  String sourceId;

  /// Copy stack association
  Optional<bool?> stack;

  /// Target asset ID
  String targetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCopyDto &&
    other.albums == albums &&
    other.favorite == favorite &&
    other.sharedLinks == sharedLinks &&
    other.sidecar == sidecar &&
    other.sourceId == sourceId &&
    other.stack == stack &&
    other.targetId == targetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albums.hashCode) +
    (favorite.hashCode) +
    (sharedLinks.hashCode) +
    (sidecar.hashCode) +
    (sourceId.hashCode) +
    (stack.hashCode) +
    (targetId.hashCode);

  @override
  String toString() => 'AssetCopyDto[albums=$albums, favorite=$favorite, sharedLinks=$sharedLinks, sidecar=$sidecar, sourceId=$sourceId, stack=$stack, targetId=$targetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albums.isPresent) {
      final value = this.albums.value;
      json[r'albums'] = value;
    }
    if (this.favorite.isPresent) {
      final value = this.favorite.value;
      json[r'favorite'] = value;
    }
    if (this.sharedLinks.isPresent) {
      final value = this.sharedLinks.value;
      json[r'sharedLinks'] = value;
    }
    if (this.sidecar.isPresent) {
      final value = this.sidecar.value;
      json[r'sidecar'] = value;
    }
      json[r'sourceId'] = this.sourceId;
    if (this.stack.isPresent) {
      final value = this.stack.value;
      json[r'stack'] = value;
    }
      json[r'targetId'] = this.targetId;
    return json;
  }

  /// Returns a new [AssetCopyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCopyDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetCopyDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetCopyDto(
        albums: json.containsKey(r'albums') ? Optional.present(mapValueOfType<bool>(json, r'albums')) : const Optional.absent(),
        favorite: json.containsKey(r'favorite') ? Optional.present(mapValueOfType<bool>(json, r'favorite')) : const Optional.absent(),
        sharedLinks: json.containsKey(r'sharedLinks') ? Optional.present(mapValueOfType<bool>(json, r'sharedLinks')) : const Optional.absent(),
        sidecar: json.containsKey(r'sidecar') ? Optional.present(mapValueOfType<bool>(json, r'sidecar')) : const Optional.absent(),
        sourceId: mapValueOfType<String>(json, r'sourceId')!,
        stack: json.containsKey(r'stack') ? Optional.present(mapValueOfType<bool>(json, r'stack')) : const Optional.absent(),
        targetId: mapValueOfType<String>(json, r'targetId')!,
      );
    }
    return null;
  }

  static List<AssetCopyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCopyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCopyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCopyDto> mapFromJson(dynamic json) {
    final map = <String, AssetCopyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCopyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCopyDto-objects as value to a dart map
  static Map<String, List<AssetCopyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCopyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetCopyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sourceId',
    'targetId',
  };
}

