import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:mocktail/mocktail.dart';

class MockTrashSyncRepository extends Mock implements DriftTrashSyncRepository {}

void main() {
  ProviderContainer createContainer(List<Override> overrides) {
    final container = ProviderContainer(overrides: overrides);
    addTearDown(container.dispose);
    return container;
  }

  group('outOfSyncAssetsCountProvider', () {
    test('returns zero without reading repository when review mode is disabled', () async {
      final container = createContainer([
        appConfigProvider.overrideWithValue(const AppConfig()),
        trashSyncRepositoryProvider.overrideWith((ref) => throw StateError('repository should not be read')),
      ]);

      expect(await container.read(pendingTrashReviewCountProvider.future), 0);
    });

    test('watches pending review count when review mode is enabled', () async {
      final repo = MockTrashSyncRepository();
      when(() => repo.watchPendingReviewCount()).thenAnswer((_) => Stream.value(7));

      final container = createContainer([
        appConfigProvider.overrideWithValue(const AppConfig().write(SettingsKey.trashSyncMode, TrashSyncMode.review)),
        trashSyncRepositoryProvider.overrideWithValue(repo),
      ]);

      expect(await container.read(pendingTrashReviewCountProvider.future), 7);
      verify(() => repo.watchPendingReviewCount()).called(1);
    });
  });

}
