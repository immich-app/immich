import 'dart:async';

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
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../domain/service.mock.dart';
import '../../test_utils.dart';
import '../factories/user_factory.dart';
import '../mocks.dart';
import '../riverpod_mocks.dart';

class PresentationContext {
  PresentationContext._({required UserDto user})
    : currentUser = user,
      service = ServiceMocks(),
      repository = RepositoryMocks() {
    setup();
  }

  static const String serverEndpoint = 'http://localhost:3000';

  static Drift? _db;

  final UserDto currentUser;
  final ServiceMocks service;
  final RepositoryMocks repository;

  List<Override> get overrides => [
    currentUserProvider.overrideWith((ref) => CurrentUserProvider(service.user.service)),
    assetServiceProvider.overrideWithValue(service.asset.service),
    remoteAssetRepositoryProvider.overrideWithValue(repository.remoteAsset.repo),
    remoteExifRepositoryProvider.overrideWithValue(repository.remoteExif.repo),
    assetMediaRepositoryProvider.overrideWithValue(repository.assetMedia.api),
    downloadRepositoryProvider.overrideWithValue(repository.download.repo),
    tagServiceProvider.overrideWithValue(service.tag.service),
    backgroundSyncProvider.overrideWithValue(service.backgroundSync),
    partnerServiceProvider.overrideWithValue(service.partner.service),
    remoteAlbumServiceProvider.overrideWithValue(service.album.service),
    cleanupServiceProvider.overrideWithValue(service.cleanup.service),
    gCastServiceProvider.overrideWithValue(MockGCastService()),
    foregroundUploadServiceProvider.overrideWithValue(service.upload),
    serverInfoProvider.overrideWith((ref) => FakeServerInfoNotifier()),
    toastRepositoryProvider.overrideWithValue(repository.toast),
  ];

  static Future<PresentationContext> create() async {
    TestUtils.init();
    if (_db == null) {
      final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
      await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
      await StoreService.I.put(StoreKey.serverEndpoint, serverEndpoint);
      _db = db;
    }
    return PresentationContext._(user: UserFactory.createDto());
  }

  void setup() {
    when(service.user.tryGetMyUser).thenReturn(currentUser);
  }

  void dispose() {
    addTearDown(() {
      service.resetAll();
    });
  }
}

typedef ResolvedAction = ({
  IconData icon,
  String label,
  Future<void> Function() onAction,
  Future<void> Function()? onSecondaryAction,
});

extension PumpPresentationWidget on WidgetTester {
  Future<void> pumpUntilFound(Finder finder, {int maxFrames = 10}) async {
    for (var i = 0; i < maxFrames; i++) {
      await pump();
      if (finder.evaluate().isNotEmpty) {
        return;
      }
    }
    throw StateError('pumpUntilFound: $finder not found within $maxFrames frames');
  }

  Future<void> pumpTestWidget(PresentationContext context, Widget widget, {List<Override> overrides = const []}) async {
    await pumpWidget(
      EasyLocalization(
        supportedLocales: locales.values.toList(),
        path: translationsPath,
        startLocale: locales.values.first,
        fallbackLocale: locales.values.first,
        saveLocale: false,
        useFallbackTranslations: true,
        assetLoader: const CodegenLoader(),
        child: ProviderScope(
          overrides: [...context.overrides, ...overrides],
          child: Builder(
            builder: (context) => MaterialApp(
              debugShowCheckedModeBanner: false,
              scaffoldMessengerKey: scaffoldMessengerKey,
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: Scaffold(body: widget),
            ),
          ),
        ),
      ),
    );
    await pumpAndSettle();
  }

  Future<ResolvedAction?> resolveAction(
    PresentationContext context,
    BaseAction action, {
    Iterable<BaseAsset> assets = const [],
    List<Override> overrides = const [],
  }) async {
    ResolvedAction? resolved;
    await pumpTestWidget(
      context,
      Consumer(
        builder: (_, ref, _) {
          if (action.isVisible(ref, assets)) {
            final onSecondaryAction = action.onSecondaryAction;
            resolved = (
              icon: action.icon(ref),
              label: action.label(ref.context),
              onAction: () => action.onAction(ref, assets),
              onSecondaryAction: onSecondaryAction == null ? null : () => onSecondaryAction(ref, assets),
            );
          }
          return const SizedBox.shrink();
        },
      ),
      overrides: overrides,
    );
    return resolved;
  }

  Future<ResolvedAction?> runAction(
    PresentationContext context,
    BaseAction action, {
    Iterable<BaseAsset> assets = const [],
    List<Override> overrides = const [],
  }) async {
    final resolved = await resolveAction(context, action, assets: assets, overrides: overrides);
    unawaited(resolved?.onAction());
    await pumpAndSettle();
    return resolved;
  }
}
