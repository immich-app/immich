import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/server/album_sharing.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class _MockAlbumsApi extends Mock implements AlbumsApi {}

void main() {
  late _MockAlbumsApi api;
  late AlbumSharingApiRepository repository;

  AlbumResponseDto album({bool? hasPrivateAssets, bool? includePrivateAssets}) => AlbumResponseDto(
    id: 'album-id',
    albumName: 'Album',
    albumThumbnailAssetId: null,
    assetCount: 1,
    createdAt: DateTime.utc(2026),
    updatedAt: DateTime.utc(2026),
    description: null,
    hasSharedLink: false,
    isActivityEnabled: true,
    shared: false,
    hasPrivateAssets: hasPrivateAssets == null ? const Optional.absent() : Optional.present(hasPrivateAssets),
    includePrivateAssets: includePrivateAssets == null
        ? const Optional.absent()
        : Optional.present(includePrivateAssets),
  );

  setUpAll(() => registerFallbackValue(UpdateAlbumDto()));
  setUp(() {
    api = _MockAlbumsApi();
    repository = AlbumSharingApiRepository(api);
  });

  test('older servers default private sharing and its option to disabled', () async {
    when(() => api.getAlbumInfo('album-id')).thenAnswer((_) async => album());

    await expectLater(
      repository.getOptions('album-id'),
      completion((hasPrivateAssets: false, includePrivateAssets: false)),
    );
  });

  test('reads album contents and private sharing independently', () async {
    when(
      () => api.getAlbumInfo('album-id'),
    ).thenAnswer((_) async => album(hasPrivateAssets: false, includePrivateAssets: true));

    await expectLater(
      repository.getOptions('album-id'),
      completion((hasPrivateAssets: false, includePrivateAssets: true)),
    );
  });

  test('sends the explicit private sharing choice to the server', () async {
    when(() => api.updateAlbumInfo('album-id', any())).thenAnswer((_) async => album(includePrivateAssets: true));

    await repository.update('album-id', true);

    final dto = verify(() => api.updateAlbumInfo('album-id', captureAny())).captured.single as UpdateAlbumDto;
    expect(dto.includePrivateAssets.orElse(false), isTrue);
  });
}
