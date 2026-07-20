import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../repository_context.dart';

class _MockBackgroundWorkerFgHostApi extends Mock implements BackgroundWorkerFgHostApi {}

void main() {
  late MediumRepositoryContext ctx;
  late _MockBackgroundWorkerFgHostApi hostApi;
  late BackgroundWorkerFgService sut;

  setUpAll(() async {
    ctx = MediumRepositoryContext();
    await SettingsRepository.ensureInitialized(ctx.db);
    registerFallbackValue(
      BackgroundWorkerSettings(requiresCharging: false, requiresUnmetered: true, minimumDelaySeconds: 30),
    );
  });

  tearDownAll(() async {
    await ctx.dispose();
  });

  setUp(() {
    hostApi = _MockBackgroundWorkerFgHostApi();
    when(() => hostApi.enable(any())).thenAnswer((_) async {});
    when(() => hostApi.configure(any())).thenAnswer((_) async {});
    sut = BackgroundWorkerFgService(hostApi);
  });

  group('BackgroundWorkerFgService network constraint', () {
    Future<bool> configuredRequiresUnmetered({required bool photos, required bool videos}) async {
      await SettingsRepository.instance.write(.backupUseCellularForPhotos, photos);
      await SettingsRepository.instance.write(.backupUseCellularForVideos, videos);
      await sut.configure();
      final settings = verify(() => hostApi.configure(captureAny())).captured.single as BackgroundWorkerSettings;
      return settings.requiresUnmetered;
    }

    test('requires unmetered by default', () async {
      expect(await configuredRequiresUnmetered(photos: false, videos: false), isTrue);
    });

    test('does not require unmetered when photos may use cellular', () async {
      expect(await configuredRequiresUnmetered(photos: true, videos: false), isFalse);
    });

    test('does not require unmetered when videos may use cellular', () async {
      expect(await configuredRequiresUnmetered(photos: false, videos: true), isFalse);
    });

    test('does not require unmetered when both photos and videos may use cellular', () async {
      expect(await configuredRequiresUnmetered(photos: true, videos: true), isFalse);
    });

    test('enable carries the same constraint at startup', () async {
      await SettingsRepository.instance.write(.backupUseCellularForPhotos, true);
      await SettingsRepository.instance.write(.backupUseCellularForVideos, true);
      await sut.enable();
      final settings = verify(() => hostApi.enable(captureAny())).captured.single as BackgroundWorkerSettings;
      expect(settings.requiresUnmetered, isFalse);
    });
  });
}
