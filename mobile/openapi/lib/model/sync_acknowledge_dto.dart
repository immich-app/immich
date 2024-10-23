//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAcknowledgeDto {
  /// Returns a new [SyncAcknowledgeDto] instance.
  SyncAcknowledgeDto({
    this.activity,
    this.album,
    this.albumAsset,
    this.albumUser,
    this.asset,
    this.assetAlbum,
    this.assetPartner,
    this.memory,
    this.partner,
    this.person,
    this.sharedLink,
    this.stack,
    this.tag,
    this.user,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? activity;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? album;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? albumAsset;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? albumUser;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? asset;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? assetAlbum;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? assetPartner;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? memory;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? partner;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? person;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? sharedLink;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? stack;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? tag;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SyncCheckpointDto? user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAcknowledgeDto &&
    other.activity == activity &&
    other.album == album &&
    other.albumAsset == albumAsset &&
    other.albumUser == albumUser &&
    other.asset == asset &&
    other.assetAlbum == assetAlbum &&
    other.assetPartner == assetPartner &&
    other.memory == memory &&
    other.partner == partner &&
    other.person == person &&
    other.sharedLink == sharedLink &&
    other.stack == stack &&
    other.tag == tag &&
    other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (activity == null ? 0 : activity!.hashCode) +
    (album == null ? 0 : album!.hashCode) +
    (albumAsset == null ? 0 : albumAsset!.hashCode) +
    (albumUser == null ? 0 : albumUser!.hashCode) +
    (asset == null ? 0 : asset!.hashCode) +
    (assetAlbum == null ? 0 : assetAlbum!.hashCode) +
    (assetPartner == null ? 0 : assetPartner!.hashCode) +
    (memory == null ? 0 : memory!.hashCode) +
    (partner == null ? 0 : partner!.hashCode) +
    (person == null ? 0 : person!.hashCode) +
    (sharedLink == null ? 0 : sharedLink!.hashCode) +
    (stack == null ? 0 : stack!.hashCode) +
    (tag == null ? 0 : tag!.hashCode) +
    (user == null ? 0 : user!.hashCode);

  @override
  String toString() => 'SyncAcknowledgeDto[activity=$activity, album=$album, albumAsset=$albumAsset, albumUser=$albumUser, asset=$asset, assetAlbum=$assetAlbum, assetPartner=$assetPartner, memory=$memory, partner=$partner, person=$person, sharedLink=$sharedLink, stack=$stack, tag=$tag, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.activity != null) {
      json[r'activity'] = this.activity;
    } else {
    //  json[r'activity'] = null;
    }
    if (this.album != null) {
      json[r'album'] = this.album;
    } else {
    //  json[r'album'] = null;
    }
    if (this.albumAsset != null) {
      json[r'albumAsset'] = this.albumAsset;
    } else {
    //  json[r'albumAsset'] = null;
    }
    if (this.albumUser != null) {
      json[r'albumUser'] = this.albumUser;
    } else {
    //  json[r'albumUser'] = null;
    }
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
    if (this.assetAlbum != null) {
      json[r'assetAlbum'] = this.assetAlbum;
    } else {
    //  json[r'assetAlbum'] = null;
    }
    if (this.assetPartner != null) {
      json[r'assetPartner'] = this.assetPartner;
    } else {
    //  json[r'assetPartner'] = null;
    }
    if (this.memory != null) {
      json[r'memory'] = this.memory;
    } else {
    //  json[r'memory'] = null;
    }
    if (this.partner != null) {
      json[r'partner'] = this.partner;
    } else {
    //  json[r'partner'] = null;
    }
    if (this.person != null) {
      json[r'person'] = this.person;
    } else {
    //  json[r'person'] = null;
    }
    if (this.sharedLink != null) {
      json[r'sharedLink'] = this.sharedLink;
    } else {
    //  json[r'sharedLink'] = null;
    }
    if (this.stack != null) {
      json[r'stack'] = this.stack;
    } else {
    //  json[r'stack'] = null;
    }
    if (this.tag != null) {
      json[r'tag'] = this.tag;
    } else {
    //  json[r'tag'] = null;
    }
    if (this.user != null) {
      json[r'user'] = this.user;
    } else {
    //  json[r'user'] = null;
    }
    return json;
  }

  /// Returns a new [SyncAcknowledgeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAcknowledgeDto? fromJson(dynamic value) {
    upgradeDto(value, "SyncAcknowledgeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAcknowledgeDto(
        activity: SyncCheckpointDto.fromJson(json[r'activity']),
        album: SyncCheckpointDto.fromJson(json[r'album']),
        albumAsset: SyncCheckpointDto.fromJson(json[r'albumAsset']),
        albumUser: SyncCheckpointDto.fromJson(json[r'albumUser']),
        asset: SyncCheckpointDto.fromJson(json[r'asset']),
        assetAlbum: SyncCheckpointDto.fromJson(json[r'assetAlbum']),
        assetPartner: SyncCheckpointDto.fromJson(json[r'assetPartner']),
        memory: SyncCheckpointDto.fromJson(json[r'memory']),
        partner: SyncCheckpointDto.fromJson(json[r'partner']),
        person: SyncCheckpointDto.fromJson(json[r'person']),
        sharedLink: SyncCheckpointDto.fromJson(json[r'sharedLink']),
        stack: SyncCheckpointDto.fromJson(json[r'stack']),
        tag: SyncCheckpointDto.fromJson(json[r'tag']),
        user: SyncCheckpointDto.fromJson(json[r'user']),
      );
    }
    return null;
  }

  static List<SyncAcknowledgeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAcknowledgeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAcknowledgeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAcknowledgeDto> mapFromJson(dynamic json) {
    final map = <String, SyncAcknowledgeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAcknowledgeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAcknowledgeDto-objects as value to a dart map
  static Map<String, List<SyncAcknowledgeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAcknowledgeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAcknowledgeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

