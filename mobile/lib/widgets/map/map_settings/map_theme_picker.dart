import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapThemePicker extends StatelessWidget {
  final ThemeMode themeMode;
  final Function(ThemeMode) onThemeChange;

  const MapThemePicker({
    super.key,
    required this.themeMode,
    required this.onThemeChange,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Center(
            child: Text(
              "map_settings_theme_settings",
              style: context.textTheme.bodyMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ).tr(),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _BorderedMapThumbnail(
              name: "Light",
              mode: ThemeMode.light,
              shouldHighlight: themeMode == ThemeMode.light,
              onThemeChange: onThemeChange,
            ),
            _BorderedMapThumbnail(
              name: "Dark",
              mode: ThemeMode.dark,
              shouldHighlight: themeMode == ThemeMode.dark,
              onThemeChange: onThemeChange,
            ),
            _BorderedMapThumbnail(
              name: "System",
              mode: ThemeMode.system,
              shouldHighlight: themeMode == ThemeMode.system,
              onThemeChange: onThemeChange,
            ),
          ],
        ),
      ],
    );
  }
}

class _BorderedMapThumbnail extends StatelessWidget {
  final ThemeMode mode;
  final String name;
  final bool shouldHighlight;
  final Function(ThemeMode) onThemeChange;

  const _BorderedMapThumbnail({
    required this.mode,
    required this.name,
    required this.shouldHighlight,
    required this.onThemeChange,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            border: Border.fromBorderSide(
              BorderSide(
                width: 4,
                color: shouldHighlight
                    ? context.colorScheme.onSurface
                    : Colors.transparent,
              ),
            ),
            borderRadius: const BorderRadius.all(Radius.circular(20)),
          ),
          child: MapThumbnail(
            zoom: 2,
            centre: const LatLng(47, 5),
            onTap: (_, __) => onThemeChange(mode),
            themeMode: mode,
            showAttribution: false,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            name,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: shouldHighlight ? FontWeight.bold : null,
            ),
          ),
        ),
      ],
    );
  }
}
