import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:photo_manager/photo_manager.dart';

class _PhotoManagerPlugin extends PhotoManagerPlugin {
  PlatformException? error;

  @override
  Future<AssetEntity> saveImageWithPath(
    String inputFilePath, {
    String? title,
    String? desc,
    String? relativePath,
    int? orientation,
    double? latitude,
    double? longitude,
    DateTime? creationDate,
  }) async {
    if (error case final error?) {
      throw error;
    }
    return AssetEntity(id: 'asset-id', typeInt: 1, width: 1, height: 1);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.MediaSaveApi.saveToDownloads',
    StandardMessageCodec(),
  );
  const repository = FileMediaRepository();
  late PhotoManagerPlugin originalPlugin;
  late _PhotoManagerPlugin plugin;
  late List<Object?>? args;
  String? mediaId;

  setUp(() {
    debugDefaultTargetPlatformOverride = .android;
    originalPlugin = PhotoManager.plugin;
    plugin = _PhotoManagerPlugin();
    PhotoManager.withPlugin(plugin);
    args = null;
    mediaId = 'media-id';
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, (
      message,
    ) async {
      args = message! as List<Object?>;
      return <Object?>[mediaId];
    });
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
    PhotoManager.withPlugin(originalPlugin);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, null);
  });

  test('reports a normal gallery save as successful', () async {
    expect(await repository.saveImageWithFile('/tmp/photo.jpg'), isTrue);
    expect(args, isNull);
  });

  test('saves an unsupported Android MIME to Downloads', () async {
    plugin.error = PlatformException(
      code: 'saveImageWithPath',
      details: 'java.lang.IllegalArgumentException: Unsupported MIME type image/*',
    );

    expect(await repository.saveImageWithFile('/tmp/photo.CR3'), isTrue);
    expect(args, ['/tmp/photo.CR3', 'photo.CR3', 'Download/Immich']);
  });

  test('reports a failed Downloads save', () async {
    plugin.error = PlatformException(code: 'saveImageWithPath', details: 'Unsupported MIME type image/*');
    mediaId = null;

    expect(await repository.saveImageWithFile('/tmp/photo.CR3'), isFalse);
  });

  test('does not handle unrelated platform errors', () async {
    plugin.error = PlatformException(code: 'saveImageWithPath', details: 'Permission denied');

    await expectLater(repository.saveImageWithFile('/tmp/photo.CR3'), throwsA(isA<PlatformException>()));
    expect(args, isNull);
  });
}
