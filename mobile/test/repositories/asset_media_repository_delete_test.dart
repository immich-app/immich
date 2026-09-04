import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockNativeSyncApi extends Mock implements NativeSyncApi {}

class _MockStorageRepository extends Mock implements StorageRepository {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('com.fluttercandies/photo_manager');

  late AssetMediaRepository repository;
  late List<List<String>> deleteCalls;
  late Set<String> missingIds;
  late bool failEveryDelete;

  setUp(() {
    repository = AssetMediaRepository(_MockNativeSyncApi(), _MockStorageRepository());
    deleteCalls = [];
    missingIds = {};
    failEveryDelete = false;

    // whole batch is rejected as soon as single ID cannot be resolved in the MediaStore
    // happens for files removed outside of Immich (#30133)
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, (call) async {
      final arguments = Map<Object?, Object?>.from(call.arguments as Map);
      switch (call.method) {
        case 'deleteWithIds':
          final ids = (arguments['ids']! as List).cast<String>();
          deleteCalls.add(ids);
          if (failEveryDelete || ids.any(missingIds.contains)) {
            throw PlatformException(code: 'deleteWithIds failed');
          }
          return ids;
        case 'fetchEntityProperties':
          final id = arguments['id']! as String;
          if (missingIds.contains(id)) {
            return null;
          }
          return <String, Object?>{'id': id, 'type': 1, 'width': 1, 'height': 1};
      }
      throw UnimplementedError(call.method);
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, null);
  });

  group('AssetMediaRepository.deleteAll', () {
    test('returns nothing without touching the platform for an empty list', () async {
      final result = await repository.deleteAll([]);

      expect(result, isEmpty);
      expect(deleteCalls, isEmpty);
    });

    test('deletes whole batch in a single call when every asset exists', () async {
      final result = await repository.deleteAll(['a', 'b', 'c']);

      expect(result, ['a', 'b', 'c']);
      expect(deleteCalls, [
        ['a', 'b', 'c'],
      ]);
    });

    test('retries without assets that are missing from the device when batch fails', () async {
      missingIds = {'b'};

      final result = await repository.deleteAll(['a', 'b', 'c']);

      expect(result, ['a', 'c']);
      expect(deleteCalls, [
        ['a', 'b', 'c'],
        ['a', 'c'],
      ]);
    });

    test('returns nothing when every asset is missing from the device', () async {
      missingIds = {'a', 'b'};

      final result = await repository.deleteAll(['a', 'b']);

      expect(result, isEmpty);
      expect(deleteCalls, [
        ['a', 'b'],
      ]);
    });

    test('rethrows when the batch fails although every asset still exists', () async {
      failEveryDelete = true;

      await expectLater(repository.deleteAll(['a', 'b']), throwsA(isA<PlatformException>()));
      expect(deleteCalls, [
        ['a', 'b'],
      ]);
    });
  });
}
