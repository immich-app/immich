import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/album/base_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import '../../test_utils/medium_factory.dart';

void main() {
  late Drift db;
  late MediumFactory mediumFactory;

  setUp(() {
    db = Drift(
      DatabaseConnection(
        NativeDatabase.memory(),
        closeStreamsSynchronously: true,
      ),
    );
    mediumFactory = MediumFactory(db);
  });

  group('getAll', () {
    test('sorts albums by backupSelection & isIosSharedAlbum', () async {
      final localAlbumRepo =
          mediumFactory.getRepository<ILocalAlbumRepository>();
      await localAlbumRepo.upsert(
        mediumFactory.localAlbum(
          id: '1',
          backupSelection: BackupSelection.none,
        ),
      );
      await localAlbumRepo.upsert(
        mediumFactory.localAlbum(
          id: '2',
          backupSelection: BackupSelection.excluded,
        ),
      );
      await localAlbumRepo.upsert(
        mediumFactory.localAlbum(
          id: '3',
          backupSelection: BackupSelection.selected,
          isIosSharedAlbum: true,
        ),
      );
      await localAlbumRepo.upsert(
        mediumFactory.localAlbum(
          id: '4',
          backupSelection: BackupSelection.selected,
        ),
      );
      final albums = await localAlbumRepo.getAll(
        sortBy: {
          SortLocalAlbumsBy.backupSelection,
          SortLocalAlbumsBy.isIosSharedAlbum,
        },
      );
      expect(albums.length, 4);
      expect(albums[0].id, '4'); // selected
      expect(albums[1].id, '3'); // selected & isIosSharedAlbum
      expect(albums[2].id, '1'); // none
      expect(albums[3].id, '2'); // excluded
    });
  });
}
