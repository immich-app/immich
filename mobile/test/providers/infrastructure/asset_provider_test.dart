import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart' as infra;
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

class _MockAssetService extends Mock implements AssetService {}

class _MockUserService extends Mock implements UserService {}

class _StubCurrentUserNotifier extends CurrentUserProvider {
  _StubCurrentUserNotifier(super.service, UserDto? initial) {
    state = initial;
  }
}

UserDto _user(String id) => UserDto(id: id, email: '$id@example.com', name: id, profileChangedAt: DateTime(2024, 1, 1));

void main() {
  group('placesProvider', () {
    test('remote content changes refetch places for the current user', () async {
      final assetService = _MockAssetService();
      final userService = _MockUserService();
      final user = _user('u1');
      when(() => userService.tryGetMyUser()).thenReturn(user);
      when(() => userService.watchMyUser()).thenAnswer((_) => const Stream<UserDto?>.empty());
      when(() => assetService.getPlaces(any())).thenAnswer((_) async => const [('Paris', 'asset-1')]);

      final container = ProviderContainer(
        overrides: [
          assetServiceProvider.overrideWithValue(assetService),
          infra.userServiceProvider.overrideWithValue(userService),
          currentUserProvider.overrideWith((ref) => _StubCurrentUserNotifier(userService, user)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(placesProvider.future);
      verify(() => assetService.getPlaces('u1')).called(1);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      await container.read(placesProvider.future);

      verify(() => assetService.getPlaces('u1')).called(1);
    });
  });
}
