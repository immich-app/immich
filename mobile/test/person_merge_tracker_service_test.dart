import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/person_merge_tracker.service.dart';

void main() {
  group('PersonMergeTrackerService', () {
    late PersonMergeTrackerService mergeTracker;

    setUp(() {
      mergeTracker = PersonMergeTrackerService();
    });

    test('records and retrieves merge correctly', () {
      mergeTracker.recordMerge(mergedPersonId: 'A', targetPersonId: 'B');

      expect(mergeTracker.isPersonMerged('A'), isTrue);
      expect(mergeTracker.getTargetPersonId('A'), equals('B'));
      expect(mergeTracker.shouldRedirectForPerson('A'), isTrue);

      mergeTracker.markMergeRecordHandled('A');
      expect(mergeTracker.isMergeRecordHandled('A'), isTrue);
      expect(mergeTracker.shouldRedirectForPerson('A'), isFalse);
    });

    test('returns false for non-merged person', () {
      expect(mergeTracker.isPersonMerged('X'), isFalse);
      expect(mergeTracker.getTargetPersonId('X'), isNull);
      expect(mergeTracker.shouldRedirectForPerson('X'), isFalse);
    });
  });
}
