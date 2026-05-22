import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class FormattedSpan {
  final TextStyle? style;
  final VoidCallback? onTap;

  const FormattedSpan({this.style, this.onTap});
}

/// A widget that renders text with optional HTML-style formatting.
///
/// Supports the following tags:
/// - `<b>` for bold text
/// - `<link>` or any tag ending with `-link` for tappable links
///
/// Tags must not be nested. Each tag is matched independently left-to-right.
///
/// By default, `<b>` renders as [FontWeight.bold] and link tags render with an
/// underline and no tap handler. Provide [spanBuilder] to attach tap callbacks
/// or override styles per tag.
///
/// Bold-only example (no [spanBuilder] needed):
/// ```dart
/// ImmichFormattedText('Delete <b>{count}</b> items?')
/// ```
///
/// Link example:
/// ```dart
/// ImmichFormattedText(
///   'Refer to <docs-link>docs</docs-link> and <other-link>other</other-link>',
///   spanBuilder: (tag) => FormattedSpan(
///     onTap: switch (tag) {
///       'docs-link'  => () => launchUrl(docsUrl),
///       'other-link' => () => launchUrl(otherUrl),
///       _            => null,
///     },
///   ),
/// )
/// ```
class ImmichFormattedText extends StatefulWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final TextOverflow? overflow;
  final int? maxLines;
  final bool? softWrap;
  final FormattedSpan Function(String tag)? spanBuilder;

  const ImmichFormattedText(
    this.text, {
    this.spanBuilder,
    super.key,
    this.style,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.softWrap,
  });

  @override
  State<ImmichFormattedText> createState() => _ImmichFormattedTextState();
}

class _ImmichFormattedTextState extends State<ImmichFormattedText> {
  final _recognizers = <GestureRecognizer>[];

  // Matches <b>, <link>, or any *-link tag and its content.
  static final _tagPattern = RegExp(r'<(b|link|[\w]+-link)>(.*?)</\1>', caseSensitive: false, dotAll: true);

  @override
  void dispose() {
    _disposeRecognizers();
    super.dispose();
  }

  void _disposeRecognizers() {
    for (final recognizer in _recognizers) {
      recognizer.dispose();
    }
    _recognizers.clear();
  }

  List<InlineSpan> _buildSpans() {
    _disposeRecognizers();

    final spans = <InlineSpan>[];
    int cursor = 0;

    for (final match in _tagPattern.allMatches(widget.text)) {
      if (match.start > cursor) {
        spans.add(TextSpan(text: widget.text.substring(cursor, match.start)));
      }

      final tag = match.group(1)!.toLowerCase();
      final content = match.group(2)!;
      final formattedSpan = (widget.spanBuilder ?? _defaultSpanBuilder)(tag);
      final style = formattedSpan.style ?? _defaultTextStyle(tag);

      GestureRecognizer? recognizer;
      if (formattedSpan.onTap != null) {
        recognizer = TapGestureRecognizer()..onTap = formattedSpan.onTap;
        _recognizers.add(recognizer);
      }
      spans.add(TextSpan(text: content, style: style, recognizer: recognizer));

      cursor = match.end;
    }

    if (cursor < widget.text.length) {
      spans.add(TextSpan(text: widget.text.substring(cursor)));
    }

    return spans;
  }

  FormattedSpan _defaultSpanBuilder(String tag) => switch (tag) {
        'b' => const FormattedSpan(style: TextStyle(fontWeight: FontWeight.bold)),
        'link' => const FormattedSpan(style: TextStyle(decoration: TextDecoration.underline)),
        _ when tag.endsWith('-link') => const FormattedSpan(style: TextStyle(decoration: TextDecoration.underline)),
        _ => const FormattedSpan(),
      };

  TextStyle? _defaultTextStyle(String tag) => switch (tag) {
        'b' => const TextStyle(fontWeight: FontWeight.bold),
        'link' => const TextStyle(decoration: TextDecoration.underline),
        _ when tag.endsWith('-link') => const TextStyle(decoration: TextDecoration.underline),
        _ => null,
      };

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(style: widget.style, children: _buildSpans()),
      textAlign: widget.textAlign,
      overflow: widget.overflow,
      maxLines: widget.maxLines,
      softWrap: widget.softWrap,
    );
  }
}
