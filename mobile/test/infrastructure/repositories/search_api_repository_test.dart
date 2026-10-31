import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' hide AssetVisibility;
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart' hide SearchFilter;

class _MockSearchApi extends Mock implements SearchApi {}

const _v4 = SemVer(major: 4, minor: 0, patch: 0);
const _v3 = SemVer(major: 3, minor: 3, patch: 5);

SearchFilter _filter({
  String? context,
  String? filename,
  String? ocr,
  Set<Tag>? tags,
  Set<Person> people = const {},
  SearchLocationFilter location = const SearchLocationFilter(),
  SearchCameraFilter camera = const SearchCameraFilter(),
  SearchRatingFilter rating = const SearchRatingFilter(),
  bool isArchive = false,
  bool isFavorite = false,
  bool isNotInAlbum = false,
  AssetType mediaType = AssetType.other,
}) => SearchFilter(
  context: context,
  filename: filename,
  ocr: ocr,
  tags: tags,
  people: people,
  location: location,
  camera: camera,
  date: const SearchDateFilter(),
  rating: rating,
  display: SearchDisplayFilters(isNotInAlbum: isNotInAlbum, isArchive: isArchive, isFavorite: isFavorite),
  mediaType: mediaType,
);

SearchResponseDto _response({String? nextCursor, String? nextPage}) => SearchResponseDto(
  albums: SearchAlbumResponseDto(count: 0, total: 0),
  assets: SearchAssetResponseDto(count: 0, total: 0, nextCursor: nextCursor, nextPage: nextPage),
);

Map<String, dynamic> _json(Object dto) => jsonDecode(jsonEncode(dto)) as Map<String, dynamic>;

void main() {
  late _MockSearchApi api;
  late SearchApiRepository repository;

  setUpAll(() {
    registerFallbackValue(SmartSearchDto());
    registerFallbackValue(MetadataSearchDto());
  });

  Future<SearchResponseDto?> smartCall(SmartSearchDto dto) =>
      api.searchSmart(dto, abortTrigger: any(named: 'abortTrigger'));

  Future<SearchResponseDto?> metadataCall(MetadataSearchDto dto) => api.searchAssets(
    dto,
    key: any(named: 'key'),
    slug: any(named: 'slug'),
    abortTrigger: any(named: 'abortTrigger'),
  );

  setUp(() {
    api = _MockSearchApi();
    repository = SearchApiRepository(api);
    when(() => smartCall(any())).thenAnswer((_) async => _response(nextCursor: 'smart-next'));
    when(() => metadataCall(any())).thenAnswer((_) async => _response(nextCursor: 'metadata-next', nextPage: '2'));
  });

  Map<String, dynamic> capturedSmart() => _json(verify(() => smartCall(captureAny())).captured.single);

  Map<String, dynamic> capturedMetadata() => _json(verify(() => metadataCall(captureAny())).captured.single);

  group('new search api', () {
    test('maps every filter field onto a smart search', () async {
      final result = await repository.search(
        _filter(
          context: ' beach ',
          location: const SearchLocationFilter(country: 'Germany'),
          camera: const SearchCameraFilter(make: 'Canon'),
          isArchive: true,
          isFavorite: true,
          isNotInAlbum: true,
          people: {const Person(id: 'person-1', name: 'Alice')},
          tags: {const Tag(id: 'tag-1', value: 'holiday')},
          mediaType: AssetType.video,
          rating: const SearchRatingFilter(rating: Option.some(null)),
        ),
        'cursor-1',
        _v4,
      );

      expect(capturedSmart(), {
        'query': 'beach',
        'cursor': 'cursor-1',
        'size': 100,
        'filter': {
          'country': {'eq': 'Germany'},
          'make': {'eq': 'Canon'},
          'visibility': {'eq': 'archive'},
          'trashedAt': {'eq': null},
          'isFavorite': {'eq': true},
          'hasAlbums': {'eq': false},
          'personIds': {
            'all': ['person-1'],
          },
          'tagIds': {
            'all': ['tag-1'],
          },
          'type': {'eq': 'VIDEO'},
          'rating': {'eq': null},
        },
      });
      expect(result?.nextCursor, 'smart-next');
    });

    test('sends a metadata search with only the timeline and trash defaults', () async {
      final result = await repository.search(_filter(filename: 'IMG_', tags: const {}), null, _v4);

      expect(capturedMetadata(), {
        'size': 1000,
        'filter': {
          'originalFileName': {'like': 'IMG_'},
          'visibility': {'eq': 'timeline'},
          'trashedAt': {'eq': null},
        },
      });
      expect(result?.nextCursor, 'metadata-next');
    });

    test('maps ocr text and a rating', () async {
      await repository.search(
        _filter(
          ocr: 'receipt',
          rating: const SearchRatingFilter(rating: Option.some(3)),
        ),
        null,
        _v4,
      );

      final filter = capturedMetadata()['filter'] as Map<String, dynamic>;
      expect(filter['ocr'], {'matches': 'receipt'});
      expect(filter['rating'], {'eq': 3});
    });
  });

  group('legacy search api', () {
    test('sends the flat fields with a page number on 3.x servers', () async {
      final result = await repository.search(
        _filter(
          filename: 'IMG_',
          location: const SearchLocationFilter(city: 'Berlin'),
        ),
        '2',
        _v3,
      );

      final dto = capturedMetadata();
      expect(dto['originalFileName'], 'IMG_');
      expect(dto['city'], 'Berlin');
      expect(dto['page'], 2);
      expect(dto.containsKey('filter'), isFalse);
      expect(result?.nextCursor, '2');
    });
  });
}
