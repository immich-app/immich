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
const _noText = Offset(300, 500);

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

class _Below {
  int taps = 0;
  int longPresses = 0;
  int horizontalDrags = 0;
  int scales = 0;
  int selectionStarts = 0;
}

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

  Future<_Below> pumpLayer(WidgetTester tester, {bool showBoxes = false, bool scalable = false}) async {
    final below = _Below();
    await tester.pumpWidget(
      MaterialApp(
        home: Align(
          alignment: Alignment.topLeft,
          child: SizedBox.fromSize(
            size: _viewportSize,
            // Stands in for the page view around the viewer
            child: GestureDetector(
              onHorizontalDragStart: scalable ? null : (_) => below.horizontalDrags++,
              child: Stack(
                children: [
                  // Stands in for the photo view
                  Positioned.fill(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => below.taps++,
                      onLongPress: () => below.longPresses++,
                      onScaleStart: scalable ? (_) => below.scales++ : null,
                    ),
                  ),
                  Positioned.fill(
                    child: OcrSelectionLayer(
                      ocrData: ocrData,
                      imageSize: _imageSize,
                      viewportSize: _viewportSize,
                      showBoxes: showBoxes,
                      onSelectionStart: () => below.selectionStarts++,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    // The lines take a few frames to register as selectable
    await tester.pumpAndSettle();
    return below;
  }

  const mobile = TargetPlatformVariant({TargetPlatform.iOS, TargetPlatform.android});

  testWidgets('long press on text selects it instead of reaching the viewer', (tester) async {
    final below = await pumpLayer(tester);

    await tester.longPressAt(_firstLine);
    await tester.pumpAndSettle();

    expect(below.longPresses, 0);
    expect(find.text('Copy'), findsOneWidget);
    expect(below.selectionStarts, 1);

    await tester.tap(find.text('Copy'));
    await tester.pumpAndSettle();

    expect(clipboard, anyOf('hello', 'world'));
  }, variant: mobile);

  testWidgets('copies lines separated by line breaks', (tester) async {
    await pumpLayer(tester, showBoxes: true);

    await tester.longPressAt(_secondLine);
    await tester.pumpAndSettle();
    await tester.tap(find.text(defaultTargetPlatform == TargetPlatform.iOS ? 'Select All' : 'Select all'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Copy'));
    await tester.pumpAndSettle();

    expect(clipboard, 'hello world\nsecond line');
  }, variant: mobile);

  testWidgets('tap clears the selection', (tester) async {
    final below = await pumpLayer(tester);

    await tester.longPressAt(_firstLine);
    await tester.pumpAndSettle();
    expect(find.text('Copy'), findsOneWidget);

    await tester.tapAt(_noText);
    await tester.pumpAndSettle();
    expect(find.text('Copy'), findsNothing);
    expect(below.taps, 0);

    await tester.tapAt(_noText);
    await tester.pumpAndSettle();
    expect(below.taps, 1);
  }, variant: mobile);

  testWidgets('hiding the boxes clears the selection', (tester) async {
    await pumpLayer(tester, showBoxes: true);

    await tester.longPressAt(_firstLine);
    await tester.pumpAndSettle();
    expect(find.text('Copy'), findsOneWidget);

    await pumpLayer(tester);
    expect(find.text('Copy'), findsNothing);
  }, variant: mobile);

  testWidgets('gestures next to the text reach the viewer', (tester) async {
    final below = await pumpLayer(tester, showBoxes: true);

    await tester.longPressAt(_noText);
    await tester.pumpAndSettle();
    expect(below.longPresses, 1);
    expect(find.text('Copy'), findsNothing);

    await tester.tapAt(_noText);
    await tester.pumpAndSettle();
    expect(below.taps, 1);
  }, variant: mobile);

  testWidgets('tap on text reaches the viewer', (tester) async {
    final below = await pumpLayer(tester);

    await tester.tapAt(_firstLine);
    await tester.pumpAndSettle();

    expect(below.taps, 1);
  }, variant: mobile);

  testWidgets('horizontal swipe starting on text reaches the page view', (tester) async {
    final below = await pumpLayer(tester);

    await tester.dragFrom(_firstLine, const Offset(-150, 0));
    await tester.pumpAndSettle();

    expect(below.horizontalDrags, 1);
  }, variant: mobile);

  testWidgets('pan starting on text reaches the viewer', (tester) async {
    final below = await pumpLayer(tester, scalable: true);

    await tester.dragFrom(_firstLine, const Offset(-150, 0));
    await tester.pumpAndSettle();

    expect(below.scales, 1);
  }, variant: mobile);
}
