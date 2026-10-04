import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';
import 'package:timezone/data/latest.dart' as tz;

void main() {
  setUpAll(() {
    tz.initializeTimeZones();
  });

  group('getSortedTimeZones', () {
    test('sorts by offset ascending', () {
      final val = getSortedTimeZones();
      for (int i = 0; i < val.length - 1; i++) {
        expect(
          val[i].currentTimeZone.offset.compareTo(val[i + 1].currentTimeZone.offset) <= 0,
          true,
          reason: 'failed at ${val[i].currentTimeZone.offset}, ${val[i + 1].currentTimeZone.offset}',
        );
      }
    });

    test('sorts by name within the same offset', () {
      final val = getSortedTimeZones();
      for (int i = 0; i < val.length - 1; i++) {
        if (val[i].currentTimeZone.offset == val[i + 1].currentTimeZone.offset) {
          expect(
            val[i].name.compareTo(val[i + 1].name) <= 0,
            true,
            reason: 'failed at ${val[i].name}, ${val[i + 1].name}',
          );
        }
      }
    });
  });
}
