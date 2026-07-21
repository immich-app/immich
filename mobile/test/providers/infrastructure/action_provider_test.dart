import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:mocktail/mocktail.dart';

class MockActionService extends Mock implements ActionService {}

class MockAssetService extends Mock implements AssetService {}

class MockForegroundUploadService extends Mock implements ForegroundUploadService {}

class MockUserService extends Mock implements UserService {}

class FakeBuildContext extends Fake implements BuildContext {}

final _user = UserDto(id: 'user-1', email: 'user@test.dev', name: 'user', profileChangedAt: DateTime(2026));

final _asset = RemoteAsset(
  id: 'asset-1',
  name: 'photo.jpg',
  ownerId: 'user-1',
  checksum: 'checksum-1',
  type: AssetType.image,
  createdAt: DateTime(2026, 6, 10, 10, 27),
  updatedAt: DateTime(2026, 6, 10, 10, 27),
  isEdited: false,
);

void main() {
  late ProviderContainer container;
  late MockActionService actionService;
  late MockAssetService assetService;

  setUpAll(() {
    registerFallbackValue(FakeBuildContext());
    registerFallbackValue(_asset);
    registerFallbackValue(<String>[]);
  });

  setUp(() {
    actionService = MockActionService();
    assetService = MockAssetService();
    final userService = MockUserService();

    when(() => actionService.editDateTime(any(), any())).thenAnswer((_) async => true);
    when(() => assetService.watchAsset(any())).thenAnswer((_) => const Stream.empty());
    when(() => assetService.getExif(any())).thenAnswer((_) async => null);
    when(() => userService.tryGetMyUser()).thenReturn(_user);
    when(() => userService.watchMyUser()).thenAnswer((_) => const Stream.empty());

    container = ProviderContainer(
      overrides: [
        actionServiceProvider.overrideWithValue(actionService),
        assetServiceProvider.overrideWithValue(assetService),
        foregroundUploadServiceProvider.overrideWithValue(MockForegroundUploadService()),
        currentUserProvider.overrideWith((ref) => CurrentUserProvider(userService)),
      ],
    );
    addTearDown(container.dispose);
  });

  group('editDateTime', () {
    test('refreshes the exif provider when editing from the viewer', () async {
      container.read(assetViewerProvider.notifier).setAsset(_asset);
      container.listen(assetExifProvider(_asset), (_, __) {});
      await container.read(assetExifProvider(_asset).future);

      final result = await container.read(actionProvider.notifier).editDateTime(ActionSource.viewer, FakeBuildContext());

      expect(result?.success, isTrue);
      await container.read(assetExifProvider(_asset).future);
      verify(() => assetService.getExif(_asset)).called(2);
    });

    test('leaves the exif provider cached when editing from the timeline', () async {
      container.read(assetViewerProvider.notifier).setAsset(_asset);
      container.listen(assetExifProvider(_asset), (_, __) {});
      await container.read(assetExifProvider(_asset).future);

      final result = await container.read(actionProvider.notifier).editDateTime(ActionSource.timeline, FakeBuildContext());

      expect(result?.success, isTrue);
      await container.read(assetExifProvider(_asset).future);
      verify(() => assetService.getExif(_asset)).called(1);
    });

    test('does not refresh the exif provider when the edit is cancelled', () async {
      when(() => actionService.editDateTime(any(), any())).thenAnswer((_) async => false);
      container.read(assetViewerProvider.notifier).setAsset(_asset);
      container.listen(assetExifProvider(_asset), (_, __) {});
      await container.read(assetExifProvider(_asset).future);

      final result = await container.read(actionProvider.notifier).editDateTime(ActionSource.viewer, FakeBuildContext());

      expect(result, isNull);
      await container.read(assetExifProvider(_asset).future);
      verify(() => assetService.getExif(_asset)).called(1);
    });
  });
}
