import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';

class ImmichThemeProvider extends StatelessWidget {
  final ColorScheme colorScheme;
  final Widget child;

  const ImmichThemeProvider({super.key, required this.colorScheme, required this.child});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: colorScheme,
        brightness: colorScheme.brightness,
        inputDecorationTheme: InputDecorationTheme(
          floatingLabelBehavior: FloatingLabelBehavior.always,
          border: WidgetStateInputBorder.resolveWith((states) {
            final color = states.contains(WidgetState.error)
                ? colorScheme.error
                : states.contains(WidgetState.focused)
                    ? colorScheme.primary
                    : colorScheme.outline;
            return OutlineInputBorder(
              borderSide: BorderSide(color: color),
              borderRadius: const BorderRadius.all(Radius.circular(ImmichRadius.md)),
            );
          }),
          labelStyle: WidgetStateTextStyle.resolveWith((states) {
            final color = states.contains(WidgetState.error) ? colorScheme.error : colorScheme.primary;
            return TextStyle(color: color, fontWeight: FontWeight.w600);
          }),
          hintStyle: const TextStyle(fontSize: ImmichTextSize.body),
          errorStyle: TextStyle(color: colorScheme.error, fontWeight: FontWeight.w600),
        ),
      ),
      child: child,
    );
  }
}
