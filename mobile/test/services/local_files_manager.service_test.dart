import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/services/local_files_manager.service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('file_trash');
  const service = LocalFilesManagerService();

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, null);
  });

  group('LocalFilesManagerService', () {
    test('requests manage media settings through the file_trash channel', () async {
      final calls = <MethodCall>[];
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, (
        MethodCall call,
      ) async {
        calls.add(call);
        return true;
      });

      final result = await service.manageMediaPermission();

      expect(result, isTrue);
      expect(calls, hasLength(1));
      expect(calls.single.method, 'manageMediaPermission');
      expect(calls.single.arguments, isNull);
    });

    test('returns false when the native file_trash handler is missing', () async {
      final result = await service.manageMediaPermission();

      expect(result, isFalse);
    });
  });
}
