import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

void main() {
  const endpoint = 'http://localhost:3000';

  setUpAll(() async {
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, endpoint);
  });

  group('getFaceThumbnailUrl', () {
    test('omits the cache buster when updatedAt is null', () {
      expect(getFaceThumbnailUrl('person-1'), '$endpoint/people/person-1/thumbnail');
    });

    test('appends the updatedAt cache buster so a changed featured photo busts the cache (#27434)', () {
      final url = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(1717000000000));
      expect(url, '$endpoint/people/person-1/thumbnail?c=1717000000000');
    });

    test('a newer updatedAt yields a different url so the image cache key changes', () {
      final before = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(1));
      final after = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(2));
      expect(before, isNot(after));
    });
  });
}
