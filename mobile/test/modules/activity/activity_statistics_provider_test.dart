import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';
import 'package:immich_mobile/providers/activity_statistics.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../test_utils.dart';
import 'activity_mocks.dart';

void main() {
  late ActivityServiceMock activityMock;
  late ProviderContainer container;
  late ListenerMock<int> listener;

  setUp(() async {
    activityMock = ActivityServiceMock();
    container = TestUtils.createContainer(
      overrides: [
        activityServiceProvider.overrideWith((ref) => activityMock),
      ],
    );
    listener = ListenerMock();
  });

  test('Returns the proper count family', () async {
    when(
      () => activityMock.getStatistics('test-album', assetId: 'test-asset'),
    ).thenAnswer((_) async => 5);

    // Read here to make the getStatistics call
    container.read(activityStatisticsProvider('test-album', 'test-asset'));

    container.listen(
      activityStatisticsProvider('test-album', 'test-asset'),
      listener.call,
      fireImmediately: true,
    );

    // Sleep for the getStatistics future to resolve
    await Future.delayed(const Duration(milliseconds: 1));

    verifyInOrder([
      () => listener.call(null, 0),
      () => listener.call(0, 5),
    ]);

    verifyNoMoreInteractions(listener);
  });

  test('Adds activity', () async {
    when(
      () => activityMock.getStatistics('test-album'),
    ).thenAnswer((_) async => 10);

    final provider = activityStatisticsProvider('test-album');
    container.listen(
      provider,
      listener.call,
      fireImmediately: true,
    );

    // Sleep for the getStatistics future to resolve
    await Future.delayed(const Duration(milliseconds: 1));

    container.read(provider.notifier).addActivity();
    container.read(provider.notifier).addActivity();

    expect(container.read(provider), 12);
  });

  test('Removes activity', () async {
    when(
      () => activityMock.getStatistics('new-album', assetId: 'test-asset'),
    ).thenAnswer((_) async => 10);

    final provider = activityStatisticsProvider('new-album', 'test-asset');
    container.listen(
      provider,
      listener.call,
      fireImmediately: true,
    );

    // Sleep for the getStatistics future to resolve
    await Future.delayed(const Duration(milliseconds: 1));

    container.read(provider.notifier).removeActivity();
    container.read(provider.notifier).removeActivity();

    expect(container.read(provider), 8);
  });
}
