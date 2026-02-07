import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:html/dom.dart' as dom;
import 'package:html/parser.dart' as html_parser;

enum _HtmlTagType {
  bold,
  link,
  unsupported,
}

class _HtmlTag {
  final _HtmlTagType type;
  final String tagName;

  const _HtmlTag._({required this.type, required this.tagName});

  static const unsupported = _HtmlTag._(type: _HtmlTagType.unsupported, tagName: 'unsupported');

  static _HtmlTag? fromString(dom.Node node) {
    final tagName = (node is dom.Element) ? node.localName : null;
    if (tagName == null) {
      return null;
    }

    final tag = tagName.toLowerCase();
    return switch (tag) {
      'b' || 'strong' => _HtmlTag._(type: _HtmlTagType.bold, tagName: tag),
      // Convert <a> back to 'link' for handler lookup
      'a' => const _HtmlTag._(type: _HtmlTagType.link, tagName: 'link'),
      _ when tag.endsWith('-link') => _HtmlTag._(type: _HtmlTagType.link, tagName: tag),
      _ => _HtmlTag.unsupported,
    };
  }
}

/// A widget that renders text with optional HTML-style formatting.
///
/// Supports the following tags:
/// - `<b>` or `<strong>` for bold text
/// - `<link>` or any tag ending with `-link` for tappable links
///
/// Example:
/// ```dart
/// ImmichHtmlText(
///   'Refer to <link>docs</link> and <other-link>other</other-link>',
///   linkHandlers: {
///     'link': () => launchUrl(docsUrl),
///     'other-link': () => launchUrl(otherUrl),
///   },
/// )
/// ```
class ImmichHtmlText extends StatefulWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final TextOverflow? overflow;
  final int? maxLines;
  final bool? softWrap;
  final Map<String, VoidCallback>? linkHandlers;
  final TextStyle? linkStyle;

  const ImmichHtmlText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.softWrap,
    this.linkHandlers,
    this.linkStyle,
  });

  @override
  State<ImmichHtmlText> createState() => _ImmichHtmlTextState();
}

class _ImmichHtmlTextState extends State<ImmichHtmlText> {
  final _recognizers = <GestureRecognizer>[];
  dom.DocumentFragment _document = dom.DocumentFragment();

  @override
  void initState() {
    super.initState();
    _document = html_parser.parseFragment(_preprocessHtml(widget.text));
  }

  @override
  void didUpdateWidget(covariant ImmichHtmlText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text) {
      _document = html_parser.parseFragment(_preprocessHtml(widget.text));
    }
  }

  /// `<link>` tags are preprocessed to `<a>` tags because `<link>` is a
  /// void element in HTML5 and cannot have children. The linkHandlers still use
  /// 'link' as the key.
  String _preprocessHtml(String html) {
    return html
        .replaceAllMapped(
          RegExp(r'<(link)>(.*?)</\1>', caseSensitive: false),
          (match) => '<a>${match.group(2)}</a>',
        )
        .replaceAllMapped(
          RegExp(r'<(link)\s*/>', caseSensitive: false),
          (match) => '<a></a>',
        );
  }

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

    return _document.nodes.expand((node) => _buildNode(node, null, null)).toList();
  }

  Iterable<InlineSpan> _buildNode(
    dom.Node node,
    TextStyle? style,
    _HtmlTag? parentTag,
  ) sync* {
    if (node is dom.Text) {
      if (node.text.isEmpty) {
        return;
      }

      GestureRecognizer? recognizer;
      if (parentTag?.type == _HtmlTagType.link) {
        final handler = widget.linkHandlers?[parentTag?.tagName];
        if (handler != null) {
          recognizer = TapGestureRecognizer()..onTap = handler;
          _recognizers.add(recognizer);
        }
      }

      yield TextSpan(text: node.text, style: style, recognizer: recognizer);
    } else if (node is dom.Element) {
      final htmlTag = _HtmlTag.fromString(node);
      final tagStyle = _styleForTag(htmlTag);
      final mergedStyle = style?.merge(tagStyle) ?? tagStyle;
      final newParentTag = htmlTag?.type == _HtmlTagType.link ? htmlTag : parentTag;

      for (final child in node.nodes) {
        yield* _buildNode(child, mergedStyle, newParentTag);
      }
    }
  }

  TextStyle? _styleForTag(_HtmlTag? tag) {
    if (tag == null) {
      return null;
    }

    return switch (tag.type) {
      _HtmlTagType.bold => const TextStyle(fontWeight: FontWeight.bold),
      _HtmlTagType.link => widget.linkStyle ??
          TextStyle(
            color: Theme.of(context).colorScheme.primary,
            decoration: TextDecoration.underline,
          ),
      _HtmlTagType.unsupported => null,
    };
  }

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
