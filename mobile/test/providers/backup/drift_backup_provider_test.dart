import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:mocktail/mocktail.dart';

class _MockForegroundUploadService extends Mock implements ForegroundUploadService {}

class _MockBackgroundUploadService extends Mock implements BackgroundUploadService {}

class _MockUploadSpeedManager extends Mock implements UploadSpeedManager {}

void main() {
  setUpAll(() {
    registerFallbackValue(Completer<void>());
    registerFallbackValue(const UploadCallbacks());
    registerFallbackValue(<String>{});
  });

  late _MockForegroundUploadService fg;
  late _MockBackgroundUploadService bg;
  late _MockUploadSpeedManager speed;
  late DriftBackupNotifier sut;

  setUp(() {
    fg = _MockForegroundUploadService();
    bg = _MockBackgroundUploadService();
    speed = _MockUploadSpeedManager();
    sut = DriftBackupNotifier(fg, bg, speed);
  });

  tearDown(() => sut.dispose());

  // Keep getBackupCounts returning a fixed remainder forever — simulates the
  // count lagging behind reality (a just-uploaded rep's remote row hasn't synced
  // back locally yet, so the remainder doesn't drop).
  void stubFlatRemainder(int remainder) {
    when(
      () => fg.getBackupCounts(any()),
    ).thenAnswer((_) async => (total: remainder, remainder: remainder, processing: 0));
  }

  UploadCallbacks callbacksOf(Invocation inv) => inv.namedArguments[#callbacks] as UploadCallbacks;

  void whenUpload(Future<int> Function(Invocation) body) {
    when(
      () => fg.uploadCandidates(
        any(),
        any(),
        callbacks: any(named: 'callbacks'),
        skipIds: any(named: 'skipIds'),
      ),
    ).thenAnswer(body);
  }

  int uploadCallCount() => verify(
    () => fg.uploadCandidates(
      any(),
      any(),
      callbacks: any(named: 'callbacks'),
      skipIds: any(named: 'skipIds'),
    ),
  ).callCount;

  group('startForegroundBackup multi-pass loop', () {
    test('keeps running passes while uploads make progress, even if the remainder count lags', () async {
      // The exact iOS-burst regression: the representative uploads on pass 1, its
      // members only become eligible afterwards. The remainder count stays flat
      // (rep's remote row not synced yet) — the loop must NOT stop on that stale
      // count; it stops only when a pass uploads nothing new.
      stubFlatRemainder(2);
      const uploadedPerPass = ['rep', 'member'];
      var pass = 0;
      whenUpload((inv) async {
        if (pass < uploadedPerPass.length) {
          callbacksOf(inv).onSuccess?.call(uploadedPerPass[pass], 'remote-${uploadedPerPass[pass]}');
          pass++;
          return 1;
        }
        return 0;
      });

      await sut.startForegroundBackup('u1');

      // pass0 -> rep, pass1 -> member, pass2 -> nothing left to attempt -> break
      expect(uploadCallCount(), 3);
    });

    test('stops after one pass once the remainder reaches zero (normal library)', () async {
      var checks = 0;
      when(() => fg.getBackupCounts(any())).thenAnswer((_) async {
        checks++;
        // remainder 1 on the first check, 0 after the single upload cleared it
        return (total: 1, remainder: checks <= 1 ? 1 : 0, processing: 0);
      });
      whenUpload((inv) async {
        callbacksOf(inv).onSuccess?.call('a', 'remote-a');
        return 1;
      });

      await sut.startForegroundBackup('u1');

      expect(uploadCallCount(), 1);
    });

    test('never exceeds the max pass cap even if every pass makes progress', () async {
      // remainder never drops and every pass uploads a brand-new id, so neither
      // the zero-remainder nor the no-progress break can fire — only the cap can.
      stubFlatRemainder(5);
      var n = 0;
      whenUpload((inv) async {
        callbacksOf(inv).onSuccess?.call('id-${n++}', 'remote');
        return 1;
      });

      await sut.startForegroundBackup('u1');

      expect(uploadCallCount(), 6);
    });

    test('carries already-uploaded ids forward as skipIds so a later pass never re-uploads them', () async {
      stubFlatRemainder(3);
      final skipSnapshots = <Set<String>>[];
      var n = 0;
      whenUpload((inv) async {
        skipSnapshots.add({...?(inv.namedArguments[#skipIds] as Set<String>?)});
        if (n < 2) {
          callbacksOf(inv).onSuccess?.call('id-$n', 'remote');
          n++;
          return 1;
        }
        return 0;
      });

      await sut.startForegroundBackup('u1');

      expect(skipSnapshots[0], isEmpty);
      expect(skipSnapshots[1], {'id-0'});
      expect(skipSnapshots[2], {'id-0', 'id-1'});
    });

    test('the loop stops when its token is superseded mid-run instead of running to the cap', () async {
      // Re-entrancy guard: a restart (app resume / page tap) completes and
      // replaces the loop's token. The captured token then reads as completed, so
      // the loop must break instead of marching to the cap against shared state.
      // remainder never hits 0, so only the token guard can stop it.
      stubFlatRemainder(5);
      var calls = 0;
      whenUpload((inv) async {
        calls++;
        callbacksOf(inv).onSuccess?.call('id-$calls', 'remote');
        sut.stopForegroundBackup(); // supersede the in-flight loop's token
        return 1;
      });

      await sut.startForegroundBackup('u1');

      // exactly one pass ran; the superseded token broke the loop next iteration.
      expect(calls, 1);
    });
  });
}
