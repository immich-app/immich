import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/sync.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:immich_mobile/repositories/sync_api.repository.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final syncRepositoryProvider = Provider(
  (ref) => SyncRepository(
    ref.watch(dbProvider),
    ref.watch(syncApiRepositoryProvider),
  ),
);

class SyncRepository extends DatabaseRepository implements ISyncRepository {
  @override
  void Function(Album)? onAlbumAdded;

  @override
  void Function(Album)? onAlbumDeleted;

  @override
  void Function(Album)? onAlbumUpdated;

  @override
  void Function(List<Asset>)? onAssetUpserted;

  @override
  void Function(List<String>)? onAssetDeleted;

  final SyncApiRepository _apiRepository;

  SyncRepository(super.db, this._apiRepository);

  @override
  Future<void> fullSync() {
    // TODO: implement fullSync
    throw UnimplementedError();
  }

  @override
  Future<void> incrementalSync({
    required SyncStreamDtoTypesEnum type,
    required int batchSize,
  }) async {
    List<Map<SyncAction, dynamic>> batch = [];

    _apiRepository.getChanges(type).listen(
      (event) async {
        print("Received batch of ${event.length} changes");
      },
      onDone: () {},
    );
  }

  void _processBatch(
    List<Map<SyncAction, dynamic>> batch,
    SyncStreamDtoTypesEnum type,
  ) {
    switch (type) {
      case SyncStreamDtoTypesEnum.asset:
        final upserts = batch
            .where((element) => element.keys.first == SyncAction.upsert)
            .map((e) => e.values.first as Asset)
            .toList();

        final deletes = batch
            .where((element) => element.keys.first == SyncAction.delete)
            .map((e) => e.values.first as String)
            .toList();

        if (upserts.isNotEmpty) {
          onAssetUpserted?.call(upserts);
        }

        if (deletes.isNotEmpty) {
          onAssetDeleted?.call(deletes);
        }
        break;

      default:
        break;
    }
  }
}
