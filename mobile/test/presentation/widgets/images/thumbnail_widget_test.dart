import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

void main() {
  late Drift db;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'http://fixture.invalid/api');
  });

  tearDownAll(() => db.close());

  test('remote album and memory covers change cache identity for a same-hash new revision', () {
    final before = Thumbnail.remote(remoteId: 'cover', thumbhash: 'same-hash', mediaRevision: 'before');
    final after = Thumbnail.remote(remoteId: 'cover', thumbhash: 'same-hash', mediaRevision: 'after');

    expect(after.imageProvider, isNot(before.imageProvider));
    expect((before.imageProvider! as RemoteImageProvider).url, contains('c=before'));
    expect((after.imageProvider! as RemoteImageProvider).url, contains('c=after'));
  });

  test('remote covers still use thumbhash when an older server provides no revision', () {
    final thumbnail = Thumbnail.remote(remoteId: 'cover', thumbhash: 'old-hash');

    expect((thumbnail.imageProvider! as RemoteImageProvider).url, contains('c=old-hash'));
  });
}
