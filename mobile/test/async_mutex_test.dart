import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/async_mutex.dart';

void main() {
  group('Test AsyncMutex grouped', () {
    test('test ordered execution', () async {
      AsyncMutex lock = AsyncMutex();
      List<int> events = [];
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 10),
          () => events.add(1),
        ),
      );
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 3),
          () => events.add(2),
        ),
      );
      lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 1),
          () => events.add(3),
        ),
      );
      await lock.run(
        () => Future.delayed(
          const Duration(milliseconds: 10),
          () => events.add(4),
        ),
      );
      expect(events, [1, 2, 3, 4]);
    });
  });
}
