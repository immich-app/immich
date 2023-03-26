import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/async_mutex.dart';

void main() {
  group('Test AsyncMutex grouped', () {
    test('test ordered execution', () async {
      AsyncMutex lock = AsyncMutex();
      List<int> events = [];
      expect(0, lock.enqueued);
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 10),
          () => events.add(1),
        ),
      );
      expect(1, lock.enqueued);
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 3),
          () => events.add(2),
        ),
      );
      expect(2, lock.enqueued);
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 1),
          () => events.add(3),
        ),
      );
      expect(3, lock.enqueued);
      await lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 10),
          () => events.add(4),
        ),
      );
      expect(0, lock.enqueued);
      expect(events, [1, 2, 3, 4]);
    });
  });
}
