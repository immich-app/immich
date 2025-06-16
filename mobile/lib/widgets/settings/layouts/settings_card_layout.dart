import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/settings/core/setting_card.dart';

class SettingsCardLayout extends StatelessWidget {
  const SettingsCardLayout({
    super.key,
    required this.children,
    this.header,
    this.contentPadding,
    this.contentSpacing = 0,
    this.showCard = true,
    this.contentCrossAxisAlignment,
  });

  final Widget? header;

  final List<Widget> children;

  final EdgeInsetsGeometry? contentPadding;

  final CrossAxisAlignment? contentCrossAxisAlignment;

  final bool showCard;

  final double contentSpacing;
  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: contentCrossAxisAlignment ?? CrossAxisAlignment.start,
      spacing: contentSpacing,
      children: [
        ...children.map(
          (child) => child,
        ),
      ],
    );

    if (showCard) {
      return SettingCard(
        child: Column(
          children: [
            if (header != null) header!,
            Padding(
              padding: contentPadding ??
                  const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: content,
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: contentPadding ?? EdgeInsets.zero,
      child: content,
    );
  }
}
