import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/wm_executor.dart';

void main() {
  tearDown(workerManagerPatch.dispose);

  test('dispose() drains a cancelled task and delivers its result', () async {
    await workerManagerPatch.init(isolatesCount: 1, dynamicSpawning: false);

    final task = workerManagerPatch.executeGentle((onCancel) async {
      await onCancel.future;
      return 'drained';
    });

    await workerManagerPatch.dispose();

    expect(
      await task.timeout(const Duration(seconds: 5)),
      'drained',
      reason: 'the worker must finish and return its result, not be killed mid-task',
    );
  });
}
