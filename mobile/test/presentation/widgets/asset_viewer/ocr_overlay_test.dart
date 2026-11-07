import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/ocr_overlay.widget.dart';

// A 400x300 image centered in a 400x600 viewport: the image starts at y = 150.
const _viewportSize = Size(400, 600);
const _imageSize = Size(400, 300);

// Viewport rect (40, 180) - (240, 210)
const _firstLine = Offset(100, 195);
// Viewport rect (40, 240) - (240, 270)
const _secondLine = Offset(100, 255);

Ocr _line(String id, String text, double top) => Ocr(
  id: id,
  assetId: 'asset',
  x1: 0.1,
  y1: top,
  x2: 0.6,
  y2: top,
  x3: 0.6,
  y3: top + 0.1,
  x4: 0.1,
  y4: top + 0.1,
  boxScore: 1,
  textScore: 1,
  text: text,
  isVisible: true,
);

void main() {
  final ocrData = [_line('1', 'hello world', 0.1), _line('2', 'second line', 0.3)];
  String? clipboard;

  setUp(() {
    clipboard = null;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'Clipboard.setData') {
          clipboard = (call.arguments as Map)['text'] as String?;
        }
        return null;
      },
    );
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    );
  });

  Future<void> pumpLayer(WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Align(
          alignment: Alignment.topLeft,
          child: SizedBox.fromSize(
            size: _viewportSize,
            child: OcrSelectionLayer(ocrData: ocrData, imageSize: _imageSize, viewportSize: _viewportSize),
          ),
        ),
      ),
    );
    // The lines take a few frames to register as selectable
    await tester.pumpAndSettle();
  }

  const mobile = TargetPlatformVariant({TargetPlatform.iOS, TargetPlatform.android});

  testWidgets('long press on text selects it', (tester) async {
    await pumpLayer(tester);

    await tester.longPressAt(_firstLine);
    await tester.pumpAndSettle();

    expect(find.text('Copy'), findsOneWidget);

    await tester.tap(find.text('Copy'));
    await tester.pumpAndSettle();

    expect(clipboard, anyOf('hello', 'world'));
  }, variant: mobile);

  testWidgets('copies lines separated by line breaks', (tester) async {
    await pumpLayer(tester);

    await tester.longPressAt(_secondLine);
    await tester.pumpAndSettle();
    await tester.tap(find.text(defaultTargetPlatform == TargetPlatform.iOS ? 'Select All' : 'Select all'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Copy'));
    await tester.pumpAndSettle();

    expect(clipboard, 'hello world\nsecond line');
  }, variant: mobile);
}
