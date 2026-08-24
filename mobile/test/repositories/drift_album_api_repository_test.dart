import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class _MockAlbumsApi extends Mock implements AlbumsApi {}

void main() {
  late _MockAlbumsApi api;
  late DriftAlbumApiRepository repo;

  setUpAll(() {
    registerFallbackValue(BulkIdsDto(ids: const []));
  });

  setUp(() {
    api = _MockAlbumsApi();
    repo = DriftAlbumApiRepository(api);
  });

  void stubResponse(List<BulkIdResponseDto> response) {
    when(
      () => api.addAssetsToAlbum(any(), any(), abortTrigger: any(named: 'abortTrigger')),
    ).thenAnswer((_) async => response);
  }

  test('no_permission failure surfaces as failed, not added (the #22342 bug)', () async {
    stubResponse([
      BulkIdResponseDto(id: 'a1', success: false, error: const Optional.present(BulkIdErrorReason.noPermission)),
    ]);

    final result = await repo.addAssets('album1', ['a1']);

    expect(result.added, isEmpty);
    expect(result.failureReasons, {AlbumAddFailureReason.noPermission: 1});
  });

  test('duplicate is tracked as a duplicate failure reason', () async {
    stubResponse([
      BulkIdResponseDto(id: 'a1', success: false, error: const Optional.present(BulkIdErrorReason.duplicate)),
    ]);

    final result = await repo.addAssets('album1', ['a1']);

    expect(result.added, isEmpty);
    expect(result.failureReasons, {AlbumAddFailureReason.duplicate: 1});
  });

  test('success is added', () async {
    stubResponse([BulkIdResponseDto(id: 'a1', success: true)]);

    final result = await repo.addAssets('album1', ['a1']);

    expect(result.added, ['a1']);
    expect(result.failureReasons, isEmpty);
  });

  test('not_found and unknown count as failures', () async {
    stubResponse([
      BulkIdResponseDto(id: 'a1', success: false, error: const Optional.present(BulkIdErrorReason.notFound)),
      BulkIdResponseDto(id: 'a2', success: false, error: const Optional.present(BulkIdErrorReason.unknown)),
    ]);

    final result = await repo.addAssets('album1', ['a1', 'a2']);

    expect(result.added, isEmpty);
    expect(result.failureReasons, {AlbumAddFailureReason.notFound: 1, AlbumAddFailureReason.unknown: 1});
  });

  test('mixed: added kept, no_permission and duplicate counted separately', () async {
    stubResponse([
      BulkIdResponseDto(id: 'ok', success: true),
      BulkIdResponseDto(id: 'perm', success: false, error: const Optional.present(BulkIdErrorReason.noPermission)),
      BulkIdResponseDto(id: 'dup', success: false, error: const Optional.present(BulkIdErrorReason.duplicate)),
    ]);

    final result = await repo.addAssets('album1', ['ok', 'perm', 'dup']);

    expect(result.added, ['ok']);
    expect(result.failureReasons, {AlbumAddFailureReason.noPermission: 1, AlbumAddFailureReason.duplicate: 1});
  });
}
