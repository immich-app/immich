import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:immich_mobile/services/shared_link.service.dart';
import 'package:mocktail/mocktail.dart';

class MockSharedLinkService extends Mock implements SharedLinkService {}

class MockServerInfoService extends Mock implements ServerInfoService {}

class MockServerInfoNotifier extends ServerInfoNotifier {
  MockServerInfoNotifier({String externalDomain = 'https://demo.immich.app'}) : super(MockServerInfoService()) {
    state = createMockServerInfo(externalDomain: externalDomain);
  }

  @override
  Future<void> getServerConfig() async {}
}

class MockSharedLinksNotifier extends StateNotifier<AsyncValue<List<SharedLink>>>
    with Mock
    implements SharedLinksNotifier {
  MockSharedLinksNotifier() : super(const AsyncValue.loading());
}

final mockServerInfoNotifierProvider = Provider<ServerInfoNotifier>((ref) => MockServerInfoNotifier());

/// Creates a mock ServerInfo with customizable parameters for testing
ServerInfo createMockServerInfo({
  String externalDomain = 'https://demo.immich.app',
  String serverEndpoint = 'https://demo.immich.app',
}) {
  return ServerInfo(
    serverVersion: const ServerVersion(major: 1, minor: 0, patch: 0),
    latestVersion: const ServerVersion(major: 1, minor: 0, patch: 0),
    serverFeatures: const ServerFeatures(map: true, trash: true, oauthEnabled: false, passwordLogin: true),
    serverConfig: ServerConfig(
      trashDays: 30,
      oauthButtonText: '',
      externalDomain: externalDomain,
      mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
      mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
    ),
    serverDiskInfo: const ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0),
    isVersionMismatch: false,
    isNewReleaseAvailable: false,
    versionMismatchErrorMessage: "",
  );
}

/// Creates a mock album shared link with customizable parameters for testing
SharedLink createAlbumSharedLink({
  String id = '1',
  String title = 'Test Album',
  String description = 'Test Description',
  String key = 'test-key',
  String? slug = 'test-slug',
  bool allowUpload = true,
  bool allowDownload = true,
  bool showMetadata = true,
  String? password,
}) {
  return SharedLink(
    id: id,
    title: title,
    description: description,
    key: key,
    slug: slug,
    expiresAt: DateTime.now().add(const Duration(days: 1)),
    allowUpload: allowUpload,
    allowDownload: allowDownload,
    showMetadata: showMetadata,
    thumbAssetId: null,
    password: password,
    type: SharedLinkSource.album,
  );
}

/// Creates a shared link with slug for testing
SharedLink createSharedLinkWithSlug() {
  return SharedLink(
    id: '1',
    title: 'Test Link',
    description: 'Test Description',
    key: 'test-key',
    slug: 'test-slug',
    expiresAt: DateTime.now().add(const Duration(days: 1)),
    allowUpload: true,
    allowDownload: true,
    showMetadata: true,
    thumbAssetId: null,
    password: null,
    type: SharedLinkSource.album,
  );
}

/// Creates a shared link without slug for testing
SharedLink createSharedLinkWithoutSlug() {
  return SharedLink(
    id: '2',
    title: 'Test Link 2',
    description: 'Test Description 2',
    key: 'test-key-2',
    slug: null,
    expiresAt: DateTime.now().add(const Duration(days: 1)),
    allowUpload: false,
    allowDownload: false,
    showMetadata: false,
    thumbAssetId: null,
    password: null,
    type: SharedLinkSource.individual,
  );
}

/// Sets up default server info with external domain for testing
void setupDefaultServerInfo(MockServerInfoNotifier mockServerInfoNotifier) {
  final mockServerInfo = createMockServerInfo(externalDomain: 'https://example.com');
  mockServerInfoNotifier.state = mockServerInfo;
}

/// Sets up empty external domain for testing
void setupEmptyExternalDomain(ServerInfoNotifier mockServerInfoNotifier) {
  final mockServerInfoWithEmptyDomain = createMockServerInfo(externalDomain: '');
  mockServerInfoNotifier.state = mockServerInfoWithEmptyDomain;
}

/// Sets up default mock responses for shared link service
void setupDefaultMockResponses(MockSharedLinkService mockSharedLinkService) {
  when(
    () => mockSharedLinkService.createSharedLink(
      albumId: any(named: 'albumId'),
      assetIds: any(named: 'assetIds'),
      showMeta: any(named: 'showMeta'),
      allowDownload: any(named: 'allowDownload'),
      allowUpload: any(named: 'allowUpload'),
      description: any(named: 'description'),
      password: any(named: 'password'),
      expiresAt: any(named: 'expiresAt'),
    ),
  ).thenAnswer(
    (_) async => createAlbumSharedLink(id: 'new-link-id', title: 'New Link', key: 'new-key', slug: 'new-slug'),
  );
}

/// Sets up mock response for link without slug
void setupMockResponseForLinkWithoutSlug(MockSharedLinkService mockSharedLinkService) {
  when(
    () => mockSharedLinkService.createSharedLink(
      albumId: any(named: 'albumId'),
      assetIds: any(named: 'assetIds'),
      showMeta: any(named: 'showMeta'),
      allowDownload: any(named: 'allowDownload'),
      allowUpload: any(named: 'allowUpload'),
      description: any(named: 'description'),
      password: any(named: 'password'),
      expiresAt: any(named: 'expiresAt'),
    ),
  ).thenAnswer((_) async => createAlbumSharedLink(id: 'new-link-id', title: 'New Link', key: 'new-key', slug: null));
}

/// Test utility to capture clipboard operations for verification
class ClipboardCapturer {
  String text = '';

  void clear() {
    text = '';
  }
}

/// Sets up a mock clipboard handler for tests that captures clipboard operations
void setupClipboardMock(ClipboardCapturer capturer) {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (
    methodCall,
  ) async {
    if (methodCall.method == 'Clipboard.setData') {
      final data = methodCall.arguments as Map<String, dynamic>;
      final text = data['text'] as String?;
      capturer.text = text ?? '';
      return null;
    }
    return null;
  });
}

/// Cleans up the clipboard mock after tests to prevent interference
void cleanupClipboardMock() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    SystemChannels.platform,
    null,
  );
}

/// Sets up larger viewport for test button visibility
void setupTestViewport() {
  TestWidgetsFlutterBinding.instance.platformDispatcher.views.first.physicalSize = const Size(1200, 2000);
  TestWidgetsFlutterBinding.instance.platformDispatcher.views.first.devicePixelRatio = 1.0;
}
