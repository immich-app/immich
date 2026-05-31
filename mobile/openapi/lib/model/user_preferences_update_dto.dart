// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserPreferencesUpdateDto {
  const UserPreferencesUpdateDto({
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

  final Optional<AlbumsUpdate> albums;

  final Optional<AvatarUpdate> avatar;

  final Optional<CastUpdate> cast;

  final Optional<DownloadUpdate> download;

  final Optional<EmailNotificationsUpdate> emailNotifications;

  final Optional<FoldersUpdate> folders;

  final Optional<MemoriesUpdate> memories;

  final Optional<PeopleUpdate> people;

  final Optional<PurchaseUpdate> purchase;

  final Optional<RatingsUpdate> ratings;

  final Optional<SharedLinksUpdate> sharedLinks;

  final Optional<TagsUpdate> tags;

  static UserPreferencesUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserPreferencesUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albums: json.containsKey(r'albums')
          ? Optional.present((AlbumsUpdate.fromJson(json[r'albums']))!)
          : const Optional.absent(),
      avatar: json.containsKey(r'avatar')
          ? Optional.present((AvatarUpdate.fromJson(json[r'avatar']))!)
          : const Optional.absent(),
      cast: json.containsKey(r'cast')
          ? Optional.present((CastUpdate.fromJson(json[r'cast']))!)
          : const Optional.absent(),
      download: json.containsKey(r'download')
          ? Optional.present((DownloadUpdate.fromJson(json[r'download']))!)
          : const Optional.absent(),
      emailNotifications: json.containsKey(r'emailNotifications')
          ? Optional.present((EmailNotificationsUpdate.fromJson(json[r'emailNotifications']))!)
          : const Optional.absent(),
      folders: json.containsKey(r'folders')
          ? Optional.present((FoldersUpdate.fromJson(json[r'folders']))!)
          : const Optional.absent(),
      memories: json.containsKey(r'memories')
          ? Optional.present((MemoriesUpdate.fromJson(json[r'memories']))!)
          : const Optional.absent(),
      people: json.containsKey(r'people')
          ? Optional.present((PeopleUpdate.fromJson(json[r'people']))!)
          : const Optional.absent(),
      purchase: json.containsKey(r'purchase')
          ? Optional.present((PurchaseUpdate.fromJson(json[r'purchase']))!)
          : const Optional.absent(),
      ratings: json.containsKey(r'ratings')
          ? Optional.present((RatingsUpdate.fromJson(json[r'ratings']))!)
          : const Optional.absent(),
      sharedLinks: json.containsKey(r'sharedLinks')
          ? Optional.present((SharedLinksUpdate.fromJson(json[r'sharedLinks']))!)
          : const Optional.absent(),
      tags: json.containsKey(r'tags')
          ? Optional.present((TagsUpdate.fromJson(json[r'tags']))!)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albums case Present(:final value)) {
      json[r'albums'] = value.toJson();
    }
    if (avatar case Present(:final value)) {
      json[r'avatar'] = value.toJson();
    }
    if (cast case Present(:final value)) {
      json[r'cast'] = value.toJson();
    }
    if (download case Present(:final value)) {
      json[r'download'] = value.toJson();
    }
    if (emailNotifications case Present(:final value)) {
      json[r'emailNotifications'] = value.toJson();
    }
    if (folders case Present(:final value)) {
      json[r'folders'] = value.toJson();
    }
    if (memories case Present(:final value)) {
      json[r'memories'] = value.toJson();
    }
    if (people case Present(:final value)) {
      json[r'people'] = value.toJson();
    }
    if (purchase case Present(:final value)) {
      json[r'purchase'] = value.toJson();
    }
    if (ratings case Present(:final value)) {
      json[r'ratings'] = value.toJson();
    }
    if (sharedLinks case Present(:final value)) {
      json[r'sharedLinks'] = value.toJson();
    }
    if (tags case Present(:final value)) {
      json[r'tags'] = value.toJson();
    }
    return json;
  }

  UserPreferencesUpdateDto copyWith({
    Optional<AlbumsUpdate>? albums,
    Optional<AvatarUpdate>? avatar,
    Optional<CastUpdate>? cast,
    Optional<DownloadUpdate>? download,
    Optional<EmailNotificationsUpdate>? emailNotifications,
    Optional<FoldersUpdate>? folders,
    Optional<MemoriesUpdate>? memories,
    Optional<PeopleUpdate>? people,
    Optional<PurchaseUpdate>? purchase,
    Optional<RatingsUpdate>? ratings,
    Optional<SharedLinksUpdate>? sharedLinks,
    Optional<TagsUpdate>? tags,
  }) {
    return .new(
      albums: albums ?? this.albums,
      avatar: avatar ?? this.avatar,
      cast: cast ?? this.cast,
      download: download ?? this.download,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      folders: folders ?? this.folders,
      memories: memories ?? this.memories,
      people: people ?? this.people,
      purchase: purchase ?? this.purchase,
      ratings: ratings ?? this.ratings,
      sharedLinks: sharedLinks ?? this.sharedLinks,
      tags: tags ?? this.tags,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserPreferencesUpdateDto &&
            albums == other.albums &&
            avatar == other.avatar &&
            cast == other.cast &&
            download == other.download &&
            emailNotifications == other.emailNotifications &&
            folders == other.folders &&
            memories == other.memories &&
            people == other.people &&
            purchase == other.purchase &&
            ratings == other.ratings &&
            sharedLinks == other.sharedLinks &&
            tags == other.tags);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      albums,
      avatar,
      cast,
      download,
      emailNotifications,
      folders,
      memories,
      people,
      purchase,
      ratings,
      sharedLinks,
      tags,
    ]);
  }

  @override
  String toString() =>
      'UserPreferencesUpdateDto(albums=$albums, avatar=$avatar, cast=$cast, download=$download, emailNotifications=$emailNotifications, folders=$folders, memories=$memories, people=$people, purchase=$purchase, ratings=$ratings, sharedLinks=$sharedLinks, tags=$tags)';
}
