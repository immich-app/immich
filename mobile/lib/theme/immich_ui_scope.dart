import 'package:flutter/widgets.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_ui/immich_ui.dart';

/// Wrapping providers for Immich translations, themes, and other UI concepts
class ImmichUiScope extends StatelessWidget {
  const ImmichUiScope({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ImmichTranslationProvider(
      translations: ImmichTranslations(submit: context.t.submit, password: context.t.password, undo: context.t.undo),
      child: ImmichThemeProvider(colorScheme: context.colorScheme, child: child),
    );
  }
}
