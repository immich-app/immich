import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link_edit.page.dart';
import 'package:mocktail/mocktail.dart';

class ClipboardCapturer {
  String text = '';

  void clear() {
    text = '';
  }
}

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

void cleanupClipboardMock() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    SystemChannels.platform,
    null,
  );
}

void setupTestViewport() {
  TestWidgetsFlutterBinding.instance.platformDispatcher.views.first.physicalSize = const Size(1200, 2000);
  TestWidgetsFlutterBinding.instance.platformDispatcher.views.first.devicePixelRatio = 1.0;
}

Future<void> createSharedLink(WidgetTester tester) async {
  await tester.enterText(find.byType(TextField).at(0), 'Test Description');
  await tester.pump();

  final createButton = find.widgetWithText(ElevatedButton, 'create_link');
  await tester.ensureVisible(createButton);
  await tester.tap(createButton);
  await tester.pumpAndSettle();
}

Future<void> pumpSharedLinkEditPage(
  WidgetTester tester,
  ProviderContainer container, {
  SharedLink? existingLink,
  List<String>? assetsList,
  String? albumId,
}) async {
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp(
        home: SharedLinkEditPage(existingLink: existingLink, assetsList: assetsList, albumId: albumId),
      ),
    ),
  );
  await tester.pumpAndSettle();
}
