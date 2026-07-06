import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:logging/logging.dart';

void main() {
  late List<LogRecord> records;
  late StreamSubscription<LogRecord> logSubscription;

  bool isNoEmissionAlarm(LogRecord r) => r.level == Level.SEVERE && r.message.contains('no bucket emission');

  setUp(() {
    records = [];
    Logger.root.level = Level.INFO;
    logSubscription = Logger.root.onRecord.listen(records.add);
  });

  tearDown(() {
    Logger.root.level = Level.OFF;
    return logSubscription.cancel();
  });

  test('logs a severe signature when the first bucket emission never arrives', () {
    fakeAsync((async) {
      final ctrl = StreamController<List<Bucket>>();
      final sut = TimelineService((
        assetSource: (index, count) async => const [],
        bucketSource: () => ctrl.stream,
        origin: TimelineOrigin.main,
      ));

      async.elapse(const Duration(seconds: 9));
      expect(records.where(isNoEmissionAlarm), isEmpty);

      async.elapse(const Duration(seconds: 2));
      expect(records.where(isNoEmissionAlarm), isNotEmpty);

      sut.dispose();
      ctrl.close();
    });
  });

  test('stays quiet when the first bucket emission arrives in time', () {
    fakeAsync((async) {
      final ctrl = StreamController<List<Bucket>>();
      final sut = TimelineService((
        assetSource: (index, count) async => const [],
        bucketSource: () => ctrl.stream,
        origin: TimelineOrigin.main,
      ));

      ctrl.add(const []);
      async.elapse(const Duration(seconds: 15));
      expect(records.where(isNoEmissionAlarm), isEmpty);

      sut.dispose();
      ctrl.close();
    });
  });

  test('stays quiet when the service is disposed before the alarm', () {
    fakeAsync((async) {
      final ctrl = StreamController<List<Bucket>>();
      final sut = TimelineService((
        assetSource: (index, count) async => const [],
        bucketSource: () => ctrl.stream,
        origin: TimelineOrigin.main,
      ));

      async.elapse(const Duration(seconds: 2));
      sut.dispose();
      async.elapse(const Duration(seconds: 15));
      expect(records.where(isNoEmissionAlarm), isEmpty);

      ctrl.close();
    });
  });
}
