import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class HtmlTextBoldText extends StatelessWidget {
  const HtmlTextBoldText({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichHtmlText(
      'This is <b>bold text</b> and <strong>strong text</strong>.',
    );
  }
}
