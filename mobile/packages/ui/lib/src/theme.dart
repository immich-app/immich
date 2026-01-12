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
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: colorScheme.primary),
            borderRadius: const BorderRadius.all(Radius.circular(ImmichRadius.md)),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: colorScheme.primary),
            borderRadius: const BorderRadius.all(Radius.circular(ImmichRadius.md)),
          ),
          errorBorder: OutlineInputBorder(
            borderSide: BorderSide(color: colorScheme.error),
            borderRadius: const BorderRadius.all(Radius.circular(ImmichRadius.md)),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderSide: BorderSide(color: colorScheme.error),
            borderRadius: const BorderRadius.all(Radius.circular(ImmichRadius.md)),
          ),
          labelStyle: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w600),
          hintStyle: const TextStyle(fontSize: ImmichTextSize.body),
          errorStyle: TextStyle(color: colorScheme.error, fontWeight: FontWeight.w600),
        ),
      ),
      child: child,
    );
  }
}
