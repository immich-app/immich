//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserPreferencesUpdateDto {
  /// Returns a new [UserPreferencesUpdateDto] instance.
  UserPreferencesUpdateDto({
    this.albums = const Optional.absent(),
    this.avatar = const Optional.absent(),
    this.cast = const Optional.absent(),
    this.download = const Optional.absent(),
    this.emailNotifications = const Optional.absent(),
    this.folders = const Optional.absent(),
    this.memories = const Optional.absent(),
    this.people = const Optional.absent(),
    this.purchase = const Optional.absent(),
    this.ratings = const Optional.absent(),
    this.sharedLinks = const Optional.absent(),
    this.tags = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AlbumsUpdate?> albums;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AvatarUpdate?> avatar;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<CastUpdate?> cast;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DownloadUpdate?> download;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<EmailNotificationsUpdate?> emailNotifications;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<FoldersUpdate?> folders;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<MemoriesUpdate?> memories;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<PeopleUpdate?> people;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<PurchaseUpdate?> purchase;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<RatingsUpdate?> ratings;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<SharedLinksUpdate?> sharedLinks;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<TagsUpdate?> tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserPreferencesUpdateDto &&
    other.albums == albums &&
    other.avatar == avatar &&
    other.cast == cast &&
    other.download == download &&
    other.emailNotifications == emailNotifications &&
    other.folders == folders &&
    other.memories == memories &&
    other.people == people &&
    other.purchase == purchase &&
    other.ratings == ratings &&
    other.sharedLinks == sharedLinks &&
    other.tags == tags;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albums == null ? 0 : albums!.hashCode) +
    (avatar == null ? 0 : avatar!.hashCode) +
    (cast == null ? 0 : cast!.hashCode) +
    (download == null ? 0 : download!.hashCode) +
    (emailNotifications == null ? 0 : emailNotifications!.hashCode) +
    (folders == null ? 0 : folders!.hashCode) +
    (memories == null ? 0 : memories!.hashCode) +
    (people == null ? 0 : people!.hashCode) +
    (purchase == null ? 0 : purchase!.hashCode) +
    (ratings == null ? 0 : ratings!.hashCode) +
    (sharedLinks == null ? 0 : sharedLinks!.hashCode) +
    (tags == null ? 0 : tags!.hashCode);

  @override
  String toString() => 'UserPreferencesUpdateDto[albums=$albums, avatar=$avatar, cast=$cast, download=$download, emailNotifications=$emailNotifications, folders=$folders, memories=$memories, people=$people, purchase=$purchase, ratings=$ratings, sharedLinks=$sharedLinks, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albums.isPresent) {
      final value = this.albums.value;
      json[r'albums'] = value;
    }
    if (this.avatar.isPresent) {
      final value = this.avatar.value;
      json[r'avatar'] = value;
    }
    if (this.cast.isPresent) {
      final value = this.cast.value;
      json[r'cast'] = value;
    }
    if (this.download.isPresent) {
      final value = this.download.value;
      json[r'download'] = value;
    }
    if (this.emailNotifications.isPresent) {
      final value = this.emailNotifications.value;
      json[r'emailNotifications'] = value;
    }
    if (this.folders.isPresent) {
      final value = this.folders.value;
      json[r'folders'] = value;
    }
    if (this.memories.isPresent) {
      final value = this.memories.value;
      json[r'memories'] = value;
    }
    if (this.people.isPresent) {
      final value = this.people.value;
      json[r'people'] = value;
    }
    if (this.purchase.isPresent) {
      final value = this.purchase.value;
      json[r'purchase'] = value;
    }
    if (this.ratings.isPresent) {
      final value = this.ratings.value;
      json[r'ratings'] = value;
    }
    if (this.sharedLinks.isPresent) {
      final value = this.sharedLinks.value;
      json[r'sharedLinks'] = value;
    }
    if (this.tags.isPresent) {
      final value = this.tags.value;
      json[r'tags'] = value;
    }
    return json;
  }

  /// Returns a new [UserPreferencesUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserPreferencesUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserPreferencesUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserPreferencesUpdateDto(
        albums: json.containsKey(r'albums') ? Optional.present(AlbumsUpdate.fromJson(json[r'albums'])) : const Optional.absent(),
        avatar: json.containsKey(r'avatar') ? Optional.present(AvatarUpdate.fromJson(json[r'avatar'])) : const Optional.absent(),
        cast: json.containsKey(r'cast') ? Optional.present(CastUpdate.fromJson(json[r'cast'])) : const Optional.absent(),
        download: json.containsKey(r'download') ? Optional.present(DownloadUpdate.fromJson(json[r'download'])) : const Optional.absent(),
        emailNotifications: json.containsKey(r'emailNotifications') ? Optional.present(EmailNotificationsUpdate.fromJson(json[r'emailNotifications'])) : const Optional.absent(),
        folders: json.containsKey(r'folders') ? Optional.present(FoldersUpdate.fromJson(json[r'folders'])) : const Optional.absent(),
        memories: json.containsKey(r'memories') ? Optional.present(MemoriesUpdate.fromJson(json[r'memories'])) : const Optional.absent(),
        people: json.containsKey(r'people') ? Optional.present(PeopleUpdate.fromJson(json[r'people'])) : const Optional.absent(),
        purchase: json.containsKey(r'purchase') ? Optional.present(PurchaseUpdate.fromJson(json[r'purchase'])) : const Optional.absent(),
        ratings: json.containsKey(r'ratings') ? Optional.present(RatingsUpdate.fromJson(json[r'ratings'])) : const Optional.absent(),
        sharedLinks: json.containsKey(r'sharedLinks') ? Optional.present(SharedLinksUpdate.fromJson(json[r'sharedLinks'])) : const Optional.absent(),
        tags: json.containsKey(r'tags') ? Optional.present(TagsUpdate.fromJson(json[r'tags'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<UserPreferencesUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserPreferencesUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserPreferencesUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserPreferencesUpdateDto> mapFromJson(dynamic json) {
    final map = <String, UserPreferencesUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserPreferencesUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserPreferencesUpdateDto-objects as value to a dart map
  static Map<String, List<UserPreferencesUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserPreferencesUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserPreferencesUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

