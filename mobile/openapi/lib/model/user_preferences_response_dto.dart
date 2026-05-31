// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserPreferencesResponseDto {
  const UserPreferencesResponseDto({
    required this.albums,
    required this.cast,
    required this.download,
    required this.emailNotifications,
    required this.folders,
    required this.memories,
    required this.people,
    required this.purchase,
    required this.ratings,
    required this.sharedLinks,
    required this.tags,
  });

  final AlbumsResponse albums;

  final CastResponse cast;

  final DownloadResponse download;

  final EmailNotificationsResponse emailNotifications;

  final FoldersResponse folders;

  final MemoriesResponse memories;

  final PeopleResponse people;

  final PurchaseResponse purchase;

  final RatingsResponse ratings;

  final SharedLinksResponse sharedLinks;

  final TagsResponse tags;

  static UserPreferencesResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserPreferencesResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albums: (AlbumsResponse.fromJson(json[r'albums']))!,
      cast: (CastResponse.fromJson(json[r'cast']))!,
      download: (DownloadResponse.fromJson(json[r'download']))!,
      emailNotifications: (EmailNotificationsResponse.fromJson(json[r'emailNotifications']))!,
      folders: (FoldersResponse.fromJson(json[r'folders']))!,
      memories: (MemoriesResponse.fromJson(json[r'memories']))!,
      people: (PeopleResponse.fromJson(json[r'people']))!,
      purchase: (PurchaseResponse.fromJson(json[r'purchase']))!,
      ratings: (RatingsResponse.fromJson(json[r'ratings']))!,
      sharedLinks: (SharedLinksResponse.fromJson(json[r'sharedLinks']))!,
      tags: (TagsResponse.fromJson(json[r'tags']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albums'] = albums.toJson();
    json[r'cast'] = cast.toJson();
    json[r'download'] = download.toJson();
    json[r'emailNotifications'] = emailNotifications.toJson();
    json[r'folders'] = folders.toJson();
    json[r'memories'] = memories.toJson();
    json[r'people'] = people.toJson();
    json[r'purchase'] = purchase.toJson();
    json[r'ratings'] = ratings.toJson();
    json[r'sharedLinks'] = sharedLinks.toJson();
    json[r'tags'] = tags.toJson();
    return json;
  }

  UserPreferencesResponseDto copyWith({
    AlbumsResponse? albums,
    CastResponse? cast,
    DownloadResponse? download,
    EmailNotificationsResponse? emailNotifications,
    FoldersResponse? folders,
    MemoriesResponse? memories,
    PeopleResponse? people,
    PurchaseResponse? purchase,
    RatingsResponse? ratings,
    SharedLinksResponse? sharedLinks,
    TagsResponse? tags,
  }) {
    return .new(
      albums: albums ?? this.albums,
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
        (other is UserPreferencesResponseDto &&
            albums == other.albums &&
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
      'UserPreferencesResponseDto(albums=$albums, cast=$cast, download=$download, emailNotifications=$emailNotifications, folders=$folders, memories=$memories, people=$people, purchase=$purchase, ratings=$ratings, sharedLinks=$sharedLinks, tags=$tags)';
}
