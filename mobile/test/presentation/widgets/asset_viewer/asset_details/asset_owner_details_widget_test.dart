import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details/asset_owner_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';
import 'package:uuid/uuid.dart';

import '../../../../test_utils.dart';
import '../../../../unit/factories/remote_asset_factory.dart';
import '../../../../unit/factories/user_factory.dart';

class _MockUserService extends Mock implements UserService {}

void main() {
  late _MockUserService mockUserService;
  late Drift db;

  setUpAll(() async {
    TestUtils.init();
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'http://localhost:3000');
  });

  setUp(() {
    mockUserService = _MockUserService();
    when(() => mockUserService.tryGetMyUser()).thenReturn(null);
    when(() => mockUserService.watchMyUser()).thenAnswer((_) => const Stream.empty());
    when(() => mockUserService.refreshMyUser()).thenAnswer((_) async => null);
    registerFallbackValue(RemoteAssetFactory.create());
  });

  tearDown(() async {
    await db.delete(db.userEntity).go();
  });

  Widget buildTestWidget({required BaseAsset asset}) {
    final overrides = <Override>[
      currentUserProvider.overrideWith((ref) => CurrentUserProvider(mockUserService)),
      driftProvider.overrideWith((ref) => db),
    ];

    return EasyLocalization(
      supportedLocales: locales.values.toList(),
      path: translationsPath,
      startLocale: locales.values.first,
      fallbackLocale: locales.values.first,
      saveLocale: false,
      useFallbackTranslations: true,
      assetLoader: const CodegenLoader(),
      child: ProviderScope(
        overrides: overrides,
        child: Builder(
          builder: (context) => MaterialApp(
            debugShowCheckedModeBanner: false,
            localizationsDelegates: context.localizationDelegates,
            supportedLocales: context.supportedLocales,
            locale: context.locale,
            home: Material(
              child: AssetOwnerDetails(asset: asset),
            ),
          ),
        ),
      ),
    );
  }

  group('AssetOwnerDetails', () {
    testWidgets('returns SizedBox.shrink for local asset', (tester) async {
      final localAsset = LocalAsset(
        id: 'local-id',
        name: 'local.jpg',
        checksum: 'checksum',
        type: AssetType.image,
        playbackStyle: AssetPlaybackStyle.image,
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
        isEdited: false,
      );

      await tester.pumpWidget(buildTestWidget(asset: localAsset));
      await tester.pumpAndSettle();

      expect(find.byType(SheetTile), findsNothing);
    });

    testWidgets('shows owner name directly when asset has owner data', (tester) async {
      when(() => mockUserService.tryGetMyUser()).thenReturn(
        UserFactory.createDto(name: 'Current User'),
      );

      final remoteAsset = RemoteAsset(
        id: const Uuid().v4(),
        name: 'photo.jpg',
        ownerId: 'owner-1',
        ownerName: 'Album Owner',
        ownerAvatarColor: AvatarColor.blue,
        checksum: 'checksum-1',
        type: AssetType.image,
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
        isEdited: false,
      );

      await tester.pumpWidget(buildTestWidget(asset: remoteAsset));
      await tester.pumpAndSettle();

      expect(find.text('Album Owner'), findsOneWidget);
    });

    testWidgets('fetches owner name from local DB when asset has no owner data', (tester) async {
      when(() => mockUserService.tryGetMyUser()).thenReturn(
        UserFactory.createDto(name: 'Current User'),
      );

      final ownerId = 'owner-2';

      await db.into(db.userEntity).insert(
        UserEntityCompanion.insert(
          id: ownerId,
          name: 'Fetched Owner',
          email: 'owner@test.com',
        ),
      );

      final remoteAsset = RemoteAsset(
        id: const Uuid().v4(),
        name: 'photo.jpg',
        ownerId: ownerId,
        checksum: 'checksum-2',
        type: AssetType.image,
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
        isEdited: false,
      );

      await tester.pumpWidget(buildTestWidget(asset: remoteAsset));
      await tester.pumpAndSettle();

      expect(find.text('Fetched Owner'), findsOneWidget);
    });

    testWidgets('hides section when asset is owned by current user', (tester) async {
      final ownerId = const Uuid().v4();
      when(() => mockUserService.tryGetMyUser()).thenReturn(
        UserFactory.createDto(id: ownerId, name: 'Current User'),
      );

      final remoteAsset = RemoteAsset(
        id: const Uuid().v4(),
        name: 'photo.jpg',
        ownerId: ownerId,
        ownerName: 'Current User',
        checksum: 'checksum-3',
        type: AssetType.image,
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
        isEdited: false,
      );

      await tester.pumpWidget(buildTestWidget(asset: remoteAsset));
      await tester.pumpAndSettle();

      expect(find.byType(SheetTile), findsNothing);
    });
  });
}
