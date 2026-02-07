import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/components/html_text.dart';

import 'test_utils.dart';

/// Text.rich creates a nested structure: root -> wrapper -> actual children
List<InlineSpan> _getContentSpans(WidgetTester tester) {
  final richText = tester.widget<RichText>(find.byType(RichText));
  final root = richText.text as TextSpan;

  if (root.children?.isNotEmpty ?? false) {
    final wrapper = root.children!.first;
    if (wrapper is TextSpan && wrapper.children != null) {
      return wrapper.children!;
    }
  }
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
  group('ImmichHtmlText', () {
    testWidgets('renders plain text without HTML tags', (tester) async {
      await tester.pumpTestWidget(
        const ImmichHtmlText('This is plain text'),
      );

      expect(find.text('This is plain text'), findsOneWidget);
    });

    testWidgets('handles mixed content with bold and links', (tester) async {
      await tester.pumpTestWidget(
        ImmichHtmlText(
          'This is an <b>example</b> of <b><link>HTML text</link></b> with <b>bold</b>.',
          linkHandlers: {'link': () {}},
        ),
      );

      final spans = _getContentSpans(tester);

      final exampleSpan = _findSpan(spans, 'example');
      expect(exampleSpan.style?.fontWeight, FontWeight.bold);

      final boldSpan = _findSpan(spans, 'bold');
      expect(boldSpan.style?.fontWeight, FontWeight.bold);

      final linkSpan = _findSpan(spans, 'HTML text');
      expect(linkSpan.style?.decoration, TextDecoration.underline);
      expect(linkSpan.style?.fontWeight, FontWeight.bold);
      expect(linkSpan.recognizer, isA<TapGestureRecognizer>());

      expect(_concatenateText(spans), 'This is an example of HTML text with bold.');
    });

    testWidgets('applies text style properties', (tester) async {
      await tester.pumpTestWidget(
        const ImmichHtmlText(
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
        const ImmichHtmlText('Text with & < > " \' characters'),
      );

      expect(find.byType(RichText), findsOneWidget);

      final spans = _getContentSpans(tester);
      expect(_concatenateText(spans), 'Text with & < > " \' characters');
    });

    group('bold', () {
      testWidgets('renders bold text with <b> tag', (tester) async {
        await tester.pumpTestWidget(
          const ImmichHtmlText('This is <b>bold</b> text'),
        );

        final spans = _getContentSpans(tester);
        final boldSpan = _findSpan(spans, 'bold');

        expect(boldSpan.style?.fontWeight, FontWeight.bold);
        expect(_concatenateText(spans), 'This is bold text');
      });

      testWidgets('renders bold text with <strong> tag', (tester) async {
        await tester.pumpTestWidget(
          const ImmichHtmlText('This is <strong>strong</strong> text'),
        );

        final spans = _getContentSpans(tester);
        final strongSpan = _findSpan(spans, 'strong');

        expect(strongSpan.style?.fontWeight, FontWeight.bold);
      });

      testWidgets('handles nested bold tags', (tester) async {
        await tester.pumpTestWidget(
          const ImmichHtmlText('Text with <b>bold and <strong>nested</strong></b>'),
        );

        final spans = _getContentSpans(tester);

        final nestedSpan = _findSpan(spans, 'nested');
        expect(nestedSpan.style?.fontWeight, FontWeight.bold);

        final boldSpan = _findSpan(spans, 'bold and ');
        expect(boldSpan.style?.fontWeight, FontWeight.bold);

        expect(_concatenateText(spans), 'Text with bold and nested');
      });
    });

    group('link', () {
      testWidgets('renders link text with <link> tag', (tester) async {
        await tester.pumpTestWidget(
          ImmichHtmlText(
            'This is a <link>custom link</link> text',
            linkHandlers: {'link': () {}},
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
          ImmichHtmlText(
            'Tap <link>here</link>',
            linkHandlers: {'link': () => linkTapped = true},
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
          ImmichHtmlText(
            'Refer to <docs-link>docs</docs-link> and <other-link>other</other-link>',
            linkHandlers: {
              'docs-link': () {},
              'other-link': () {},
            },
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
          ImmichHtmlText(
            'Click <link>here</link>',
            linkStyle: customLinkStyle,
            linkHandlers: {'link': () {}},
          ),
        );

        final spans = _getContentSpans(tester);
        final linkSpan = _findSpan(spans, 'here');

        expect(linkSpan.style?.color, Colors.red);
        expect(linkSpan.style?.decoration, TextDecoration.overline);
      });

      testWidgets('link without handler renders but is not tappable', (tester) async {
        await tester.pumpTestWidget(
          ImmichHtmlText(
            'Link without handler: <link>click me</link>',
            linkHandlers: {'other-link': () {}},
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
          ImmichHtmlText(
            'Go to <docs-link>docs</docs-link> or <help-link>help</help-link>',
            linkHandlers: {
              'docs-link': () => firstLinkTapped = true,
              'help-link': () => secondLinkTapped = true,
            },
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
