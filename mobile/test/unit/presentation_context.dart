import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_ui/immich_ui.dart';

import '../test_utils.dart';

class PresentationContext {
  const PresentationContext._();

  static const String serverEndpoint = 'http://localhost:3000';

  static Drift? _db;

  static Future<PresentationContext> create() async {
    TestUtils.init();
    if (_db == null) {
      final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
      await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
      await StoreService.I.put(StoreKey.serverEndpoint, serverEndpoint);
      _db = db;
    }
    return const PresentationContext._();
  }

  Future<void> dispose() async {
    // TODO: Dispose the store and database after each test.
    // This is currently not possible because the store is a singleton and is used across tests.
    //  Refactor the store to be created per test to allow proper disposal.
  }
}

extension PumpPresentationWidget on WidgetTester {
  Future<void> pumpTestWidget(Widget widget, {List<Override> overrides = const []}) async {
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
          overrides: overrides,
          child: Builder(
            builder: (context) => MaterialApp(
              debugShowCheckedModeBanner: false,
              scaffoldMessengerKey: scaffoldMessengerKey,
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: Material(child: widget),
            ),
          ),
        ),
      ),
    );
    await pumpAndSettle();
  }

  Future<void> pumpTestAction(BaseAction action, {List<Override> overrides = const []}) async {
    await pumpTestWidget(
      Scaffold(body: ActionIconButtonWidget(action: action)),
      overrides: overrides,
    );
    await tap(find.byType(ImmichIconButton));
    await pump();
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
