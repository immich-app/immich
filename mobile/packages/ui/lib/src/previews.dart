import 'package:flutter/material.dart';
import 'package:flutter/widget_previews.dart';
import 'package:immich_ui/src/theme.dart';

const ColorScheme _lightColorScheme = ColorScheme.light(
  primary: Color(0xFF4250AF),
  onPrimary: Colors.white,
  primaryContainer: Color(0xFFD4D6F0),
  onPrimaryContainer: Color(0xFF181E44),
  secondary: Color(0xFF737373),
  onSecondary: Colors.white,
  error: Color(0xFFE53E3E),
  onError: Colors.white,
  surface: Color(0xFFFAFAFA),
  onSurface: Color(0xFF1A1C1E),
  surfaceContainerHighest: Color(0xFFE3E4E8),
  outline: Color(0xFFD1D3D9),
  outlineVariant: Color(0xFFD4D4D4),
);

const ColorScheme _darkColorScheme = ColorScheme.dark(
  primary: Color(0xFFACCBFA),
  onPrimary: Color(0xFF0F1433),
  primaryContainer: Color(0xFF616D94),
  onPrimaryContainer: Color(0xFFD4D6F0),
  secondary: Color(0xFFC4C6D0),
  onSecondary: Color(0xFF2E3042),
  error: Color(0xFFE88080),
  onError: Color(0xFF0F1433),
  surface: Color(0xFF0A0A0A),
  onSurface: Color(0xFFE3E3E6),
  surfaceContainerHighest: Color(0xFF262626),
  outline: Color(0xFF8E9099),
  outlineVariant: Color(0xFF43464F),
);

PreviewThemeData immichPreviewTheme() => PreviewThemeData(
      materialLight: ThemeData(colorScheme: _lightColorScheme, useMaterial3: true),
      materialDark: ThemeData(colorScheme: _darkColorScheme, useMaterial3: true),
    );

Widget immichPreviewWrapper(Widget child) {
  return Builder(
    builder: (context) => ImmichThemeProvider(
      colorScheme: Theme.of(context).colorScheme,
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Align(alignment: Alignment.topLeft, child: child),
        ),
      ),
    ),
  );
}

final class ImmichPreview extends Preview {
  const ImmichPreview({super.name, super.group, super.size, super.textScaleFactor})
      : super(theme: immichPreviewTheme, wrapper: immichPreviewWrapper);
}
