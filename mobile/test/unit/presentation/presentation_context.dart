import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../test_utils.dart';
import '../factories/user_factory.dart';
import '../mocks.dart';

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
    partnerServiceProvider.overrideWithValue(service.partner.service),
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

extension PumpPresentationWidget on WidgetTester {
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

  Future<BaseAction> pumpTestAction(
    PresentationContext context,
    BaseAction Function(ActionScope scope) build, {
    List<Override> overrides = const [],
  }) async {
    final action = await pumpActionButton(context, build, overrides: overrides);
    await tap(find.byType(ImmichIconButton));
    await pump();
    return action;
  }

  Future<BaseAction> pumpActionButton(
    PresentationContext context,
    BaseAction Function(ActionScope scope) build, {
    List<Override> overrides = const [],
  }) async {
    late BaseAction action;
    await pumpTestWidget(
      context,
      Consumer(
        builder: (innerContext, ref, _) {
          action = build(ActionScope(context: innerContext, ref: ref, authUser: context.currentUser));
          return ActionIconButtonWidget(action: action);
        },
      ),
      overrides: overrides,
    );
    return action;
  }

  Future<void> pumpUntilFound(Finder finder, {int maxFrames = 10}) async {
    for (var i = 0; i < maxFrames; i++) {
      await pump();
      if (finder.evaluate().isNotEmpty) {
        return;
      }
    }
    throw StateError('pumpUntilFound: $finder not found within $maxFrames frames');
  }
}
