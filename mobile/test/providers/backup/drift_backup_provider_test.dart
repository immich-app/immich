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

  UploadCallbacks callbacksOf(Invocation inv) => inv.namedArguments[#callbacks] as UploadCallbacks;

  void whenUpload(Future<({int attempted, bool hadBurst})> Function(Invocation) body) {
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
    test('keeps running passes while a pass still uploads burst frames', () async {
      // The iOS-burst path: the representative uploads on pass 0, its member only
      // becomes eligible afterwards (pass 1). Each burst pass reports hadBurst so
      // the loop keeps going; it stops once a pass attempts nothing new.
      var pass = 0;
      whenUpload((inv) async {
        if (pass == 0) {
          callbacksOf(inv).onSuccess?.call('rep', 'remote-rep');
          pass++;
          return (attempted: 1, hadBurst: true);
        }
        if (pass == 1) {
          callbacksOf(inv).onSuccess?.call('member', 'remote-member');
          pass++;
          return (attempted: 1, hadBurst: true);
        }
        return (attempted: 0, hadBurst: false);
      });

      await sut.startForegroundBackup('u1');

      // pass0 -> rep, pass1 -> member, pass2 -> nothing left to attempt -> break
      expect(uploadCallCount(), 3);
    });

    test('stops after one pass for a non-burst library (no burst frames)', () async {
      // No burst frames -> hadBurst is false, so nothing can be unblocked by a
      // second pass and the loop stops immediately. No extra candidate query.
      whenUpload((inv) async {
        callbacksOf(inv).onSuccess?.call('a', 'remote-a');
        return (attempted: 1, hadBurst: false);
      });

      await sut.startForegroundBackup('u1');

      expect(uploadCallCount(), 1);
    });

    test('never exceeds the max pass cap even if every pass has burst work', () async {
      // Every pass attempts something and reports hadBurst, so only the cap can
      // stop the loop.
      var n = 0;
      whenUpload((inv) async {
        callbacksOf(inv).onSuccess?.call('id-${n++}', 'remote');
        return (attempted: 1, hadBurst: true);
      });

      await sut.startForegroundBackup('u1');

      expect(uploadCallCount(), 6);
    });

    test('carries already-uploaded ids forward as skipIds so a later pass never re-uploads them', () async {
      final skipSnapshots = <Set<String>>[];
      var n = 0;
      whenUpload((inv) async {
        skipSnapshots.add({...?(inv.namedArguments[#skipIds] as Set<String>?)});
        if (n < 2) {
          callbacksOf(inv).onSuccess?.call('id-$n', 'remote');
          n++;
          return (attempted: 1, hadBurst: true);
        }
        return (attempted: 0, hadBurst: false);
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
      // Every pass reports hadBurst, so only the token guard can stop it.
      var calls = 0;
      whenUpload((inv) async {
        calls++;
        callbacksOf(inv).onSuccess?.call('id-$calls', 'remote');
        sut.stopForegroundBackup(); // supersede the in-flight loop's token
        return (attempted: 1, hadBurst: true);
      });

      await sut.startForegroundBackup('u1');

      // exactly one pass ran; the superseded token broke the loop next iteration.
      expect(calls, 1);
    });
  });
}
