import 'dart:async';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';

import 'mock_http_override.dart';

// Listener Mock to test when a provider notifies its listeners
class ListenerMock<T> extends Mock {
  // ignore: avoid-declaring-call-method
  void call(T? previous, T next);
}

abstract final class TestUtils {
  const TestUtils._();

  /// Downloads Isar binaries (if required) and initializes a new Isar db
  static Future<Isar> initIsar() async {
    await Isar.initializeIsarCore(download: true);

    final instance = Isar.getInstance();
    if (instance != null) {
      return instance;
    }

    final db = await Isar.open(
      [
        StoreValueSchema,
        ExifInfoSchema,
        AssetSchema,
        AlbumSchema,
        UserSchema,
        BackupAlbumSchema,
        DuplicatedAssetSchema,
        LoggerMessageSchema,
        ETagSchema,
        AndroidDeviceAssetSchema,
        IOSDeviceAssetSchema,
      ],
      directory: "test/",
      maxSizeMiB: 1024,
      inspector: false,
    );

    // Clear and close db on test end
    addTearDown(() async {
      await db.writeTxn(() async => await db.clear());
      await db.close();
    });
    return db;
  }

  /// Creates a new ProviderContainer to test Riverpod providers
  static ProviderContainer createContainer({
    ProviderContainer? parent,
    List<Override> overrides = const [],
    List<ProviderObserver>? observers,
  }) {
    final container = ProviderContainer(
      parent: parent,
      overrides: overrides,
      observers: observers,
    );

    // Dispose on test end
    addTearDown(container.dispose);

    return container;
  }

  static void init() {
    // Turn off easy localization logging
    EasyLocalization.logger.enableBuildModes = [];
    WidgetController.hitTestWarningShouldBeFatal = true;
    HttpOverrides.global = MockHttpOverrides();
  }

  // Workaround till the following issue is resolved
  // https://github.com/dart-lang/test/issues/2307
  static T fakeAsync<T>(
    Future<T> Function(FakeAsync _) callback, {
    DateTime? initialTime,
  }) {
    late final T result;
    Object? error;
    StackTrace? stack;
    FakeAsync(initialTime: initialTime).run((FakeAsync async) {
      bool shouldPump = true;
      unawaited(
        callback(async).then<void>(
          (value) => result = value,
          onError: (e, s) {
            error = e;
            stack = s;
          },
        ).whenComplete(() => shouldPump = false),
      );

      while (shouldPump) {
        async.flushMicrotasks();
      }
    });

    if (error != null) {
      Error.throwWithStackTrace(error!, stack!);
    }
    return result;
  }
}
