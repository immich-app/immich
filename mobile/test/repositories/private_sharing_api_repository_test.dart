import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/server/private_sharing.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class _MockTagsApi extends Mock implements TagsApi {}

class _MockSearchApi extends Mock implements SearchApi {}

class _MockSharedLinksApi extends Mock implements SharedLinksApi {}

void main() {
  late _MockTagsApi tags;
  late _MockSearchApi search;
  late _MockSharedLinksApi links;
  late PrivateSharingApiRepository sut;

  setUpAll(() => registerFallbackValue(MetadataSearchDto()));

  setUp(() {
    tags = _MockTagsApi();
    search = _MockSearchApi();
    links = _MockSharedLinksApi();
    sut = PrivateSharingApiRepository(tags, search, links);
  });

  TagResponseDto tag(String id, String value, {bool isPrivate = false}) => TagResponseDto(
    id: id,
    name: value.split('/').last,
    value: value,
    createdAt: DateTime(2026),
    updatedAt: DateTime(2026),
    isPrivate: Optional.present(isPrivate),
  );

  test('does not request metadata for an empty selection', () async {
    expect(await sut.hasPrivateAssets((assetIds: const [], linkId: null)), isFalse);
    verifyZeroInteractions(tags);
    verifyZeroInteractions(search);
  });

  test('does not search when all tags are public', () async {
    when(() => tags.getAllTags()).thenAnswer((_) async => [tag('public', 'Family')]);
    expect(await sut.hasPrivateAssets((assetIds: const ['asset'], linkId: null)), isFalse);
    verifyZeroInteractions(search);
  });

  for (final count in [0, 1]) {
    test('checks the selected photos against private tags and their descendants: $count', () async {
      when(() => tags.getAllTags()).thenAnswer(
        (_) async => [
          tag('private', 'Private', isPrivate: true),
          tag('child', 'Private/Family'),
          tag('public', 'Public'),
        ],
      );
      when(() => search.searchAssets(any())).thenAnswer(
        (_) async => SearchResponseDto(
          albums: SearchAlbumResponseDto(count: 0, total: 0),
          assets: SearchAssetResponseDto(count: count, nextCursor: null, nextPage: null),
        ),
      );

      expect(await sut.hasPrivateAssets((assetIds: const ['asset'], linkId: null)), count > 0);

      final dto = verify(() => search.searchAssets(captureAny())).captured.single as MetadataSearchDto;
      expect(dto.size.value, 1);
      expect(dto.filter.value!.or.value!.single.id.value!.eq.value, 'asset');
      expect(dto.filter.value!.tagIds.value!.any.value, ['private', 'child']);
    });
  }
}
