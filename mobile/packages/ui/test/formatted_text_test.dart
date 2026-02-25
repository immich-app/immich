import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/components/formatted_text.dart';

import 'test_utils.dart';

/// Text.rich creates a nested structure: root (DefaultTextStyle) -> wrapper (ImmichFormattedText) -> actual children
List<InlineSpan> _getContentSpans(WidgetTester tester) {
  final richText = tester.widget<RichText>(find.byType(RichText));
  final root = richText.text as TextSpan;
  final wrapper = root.children?.firstOrNull;
  if (wrapper is TextSpan) return wrapper.children ?? [];
  return [];
}

TextSpan _findSpan(List<InlineSpan> spans, String text) {
  return spans.firstWhere(
    (span) => span is TextSpan && span.text == text,
    orElse: () => throw StateError('No span found with text: "$text"'),
  ) as TextSpan;
}

String _concatenateText(List<InlineSpan> spans) {
  return spans.whereType<TextSpan>().map((s) => s.text ?? '').join();
}

void _triggerTap(TextSpan span) {
  final recognizer = span.recognizer;
  if (recognizer is TapGestureRecognizer) {
    recognizer.onTap?.call();
  }
}

void main() {
  group('ImmichFormattedText', () {
    testWidgets('renders plain text without HTML tags', (tester) async {
      await tester.pumpTestWidget(
        const ImmichFormattedText('This is plain text'),
      );

      expect(find.text('This is plain text'), findsOneWidget);
    });

    testWidgets('applies text style properties', (tester) async {
      await tester.pumpTestWidget(
        const ImmichFormattedText(
          'Test text',
          style: TextStyle(
            fontSize: 16,
            color: Colors.purple,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      );

      final text = tester.widget<Text>(find.byType(Text));
      final richText = text.textSpan as TextSpan;

      expect(richText.style?.fontSize, 16);
      expect(richText.style?.color, Colors.purple);
      expect(text.textAlign, TextAlign.center);
      expect(text.maxLines, 2);
      expect(text.overflow, TextOverflow.ellipsis);
    });

    testWidgets('handles text with special characters', (tester) async {
      await tester.pumpTestWidget(
        const ImmichFormattedText('Text with & < > " \' characters'),
      );

      expect(find.byType(RichText), findsOneWidget);

      final spans = _getContentSpans(tester);
      expect(_concatenateText(spans), 'Text with & < > " \' characters');
    });

    group('bold', () {
      testWidgets('renders bold text with <b> tag', (tester) async {
        await tester.pumpTestWidget(
          const ImmichFormattedText('This is <b>bold</b> text'),
        );

        final spans = _getContentSpans(tester);
        final boldSpan = _findSpan(spans, 'bold');

        expect(boldSpan.style?.fontWeight, FontWeight.bold);
        expect(_concatenateText(spans), 'This is bold text');
      });
    });

    group('link', () {
      testWidgets('renders link text with <link> tag', (tester) async {
        await tester.pumpTestWidget(
          ImmichFormattedText(
            'This is a <link>custom link</link> text',
            spanBuilder: (tag) => FormattedSpan(onTap: switch (tag) { 'link' => () {}, _ => null }),
          ),
        );

        final spans = _getContentSpans(tester);
        final linkSpan = _findSpan(spans, 'custom link');

        expect(linkSpan.style?.decoration, TextDecoration.underline);
        expect(linkSpan.recognizer, isA<TapGestureRecognizer>());
      });

      testWidgets('handles link tap with callback', (tester) async {
        var linkTapped = false;

        await tester.pumpTestWidget(
          ImmichFormattedText(
            'Tap <link>here</link>',
            spanBuilder: (tag) => FormattedSpan(onTap: switch (tag) { 'link' => () => linkTapped = true, _ => null }),
          ),
        );

        final spans = _getContentSpans(tester);
        final linkSpan = _findSpan(spans, 'here');
        expect(linkSpan.recognizer, isA<TapGestureRecognizer>());

        _triggerTap(linkSpan);
        expect(linkTapped, isTrue);
      });

      testWidgets('handles custom prefixed link tags', (tester) async {
        await tester.pumpTestWidget(
          ImmichFormattedText(
            'Refer to <docs-link>docs</docs-link> and <other-link>other</other-link>',
            spanBuilder: (tag) => FormattedSpan(onTap: switch (tag) {
              'docs-link' => () {},
              'other-link' => () {},
              _ => null,
            },),
          ),
        );

        final spans = _getContentSpans(tester);
        final docsSpan = _findSpan(spans, 'docs');
        final otherSpan = _findSpan(spans, 'other');

        expect(docsSpan.style?.decoration, TextDecoration.underline);
        expect(otherSpan.style?.decoration, TextDecoration.underline);
      });

      testWidgets('applies custom link style', (tester) async {
        const customLinkStyle = TextStyle(
          color: Colors.red,
          decoration: TextDecoration.overline,
        );

        await tester.pumpTestWidget(
          ImmichFormattedText(
            'Click <link>here</link>',
            spanBuilder: (tag) => FormattedSpan(style: customLinkStyle, onTap: () {}),
          ),
        );

        final spans = _getContentSpans(tester);
        final linkSpan = _findSpan(spans, 'here');

        expect(linkSpan.style?.color, Colors.red);
        expect(linkSpan.style?.decoration, TextDecoration.overline);
      });

      testWidgets('link without handler renders but is not tappable', (tester) async {
        await tester.pumpTestWidget(
          ImmichFormattedText(
            'Link without handler: <link>click me</link>',
            spanBuilder: (tag) => FormattedSpan(onTap: switch (tag) { 'other-link' => () {}, _ => null }),
          ),
        );

        final spans = _getContentSpans(tester);
        final linkSpan = _findSpan(spans, 'click me');

        expect(linkSpan.style?.decoration, TextDecoration.underline);
        expect(linkSpan.recognizer, isNull);
      });

      testWidgets('handles multiple links with different handlers', (tester) async {
        var firstLinkTapped = false;
        var secondLinkTapped = false;

        await tester.pumpTestWidget(
          ImmichFormattedText(
            'Go to <docs-link>docs</docs-link> or <help-link>help</help-link>',
            spanBuilder: (tag) => FormattedSpan(onTap: switch (tag) {
              'docs-link' => () => firstLinkTapped = true,
              'help-link' => () => secondLinkTapped = true,
              _ => null,
            },),
          ),
        );

        final spans = _getContentSpans(tester);
        final docsSpan = _findSpan(spans, 'docs');
        final helpSpan = _findSpan(spans, 'help');

        _triggerTap(docsSpan);
        expect(firstLinkTapped, isTrue);
        expect(secondLinkTapped, isFalse);

        _triggerTap(helpSpan);
        expect(secondLinkTapped, isTrue);
      });
    });
  });
}
