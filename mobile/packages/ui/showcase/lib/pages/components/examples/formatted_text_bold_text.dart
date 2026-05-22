import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class FormattedTextBoldText extends StatelessWidget {
  const FormattedTextBoldText({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichFormattedText('This is <b>bold text</b>.');
  }
}
