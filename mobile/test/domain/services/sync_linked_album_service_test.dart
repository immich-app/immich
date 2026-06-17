import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

void main() {
  // A container with the service's deps overridden but cancellationProvider left
  // alone, i.e. the root (main) isolate, where cancellationProvider has no
  // override and throws if read. The UI reads this provider here.
  ProviderContainer rootContainer() {
    final container = ProviderContainer(
      overrides: [
        localAlbumRepository.overrideWithValue(MockLocalAlbumRepository()),
        remoteAlbumRepository.overrideWithValue(MockRemoteAlbumRepository()),
        driftAlbumApiRepositoryProvider.overrideWithValue(MockDriftAlbumApiRepository()),
        storeServiceProvider.overrideWithValue(MockStoreService()),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  // Regression for #29125 (Sync Albums toggle) and #29119 (can't leave the album
  // selection screen): #28694 made the provider watch cancellationProvider, so
  // reading it off the isolate threw. The cancellation now lives on the isolate
  // call path, not the provider, so the UI can build it.
  test('builds on the root isolate without a cancellationProvider override', () {
    final container = rootContainer();

    expect(() => container.read(syncLinkedAlbumServiceProvider), returnsNormally);
    expect(container.read(syncLinkedAlbumServiceProvider), isA<SyncLinkedAlbumService>());
  });

  test('manageLinkedAlbums runs from the UI without a cancellation signal', () {
    final service = rootContainer().read(syncLinkedAlbumServiceProvider);

    expect(service.manageLinkedAlbums(const [], 'user-1'), completes);
  });
}
