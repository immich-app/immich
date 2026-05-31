// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchResponseDto {
  const SearchResponseDto({required this.albums, required this.assets});

  final SearchAlbumResponseDto albums;

  final SearchAssetResponseDto assets;

  static SearchResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albums: (SearchAlbumResponseDto.fromJson(json[r'albums']))!,
      assets: (SearchAssetResponseDto.fromJson(json[r'assets']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albums'] = albums.toJson();
    json[r'assets'] = assets.toJson();
    return json;
  }

  SearchResponseDto copyWith({SearchAlbumResponseDto? albums, SearchAssetResponseDto? assets}) {
    return .new(albums: albums ?? this.albums, assets: assets ?? this.assets);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SearchResponseDto && albums == other.albums && assets == other.assets);
  }

  @override
  int get hashCode {
    return Object.hashAll([albums, assets]);
  }

  @override
  String toString() => 'SearchResponseDto(albums=$albums, assets=$assets)';
}
