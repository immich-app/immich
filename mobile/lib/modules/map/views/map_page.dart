import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_settings.provider.dart';
import 'package:immich_mobile/modules/map/ui/map_settings_dialog.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

class MapPage extends HookConsumerWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ThemeData theme = Theme.of(context);
    final mapSettingsNotifier = ref.watch(mapSettingsStateNotifier);
    final isDarkTheme = useState(mapSettingsNotifier.isDarkTheme);

    useEffect(
      () {
        isDarkTheme.value = mapSettingsNotifier.isDarkTheme;
        return null;
      },
      [mapSettingsNotifier],
    );

    Widget buildBackButton() {
      return ElevatedButton(
        onPressed: () async => await AutoRouter.of(context).pop(),
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
          padding: const EdgeInsets.all(12),
          backgroundColor: isDarkTheme.value ? Colors.white : theme.cardColor,
          foregroundColor: theme.primaryColor,
        ),
        child: Icon(
          Icons.arrow_back_ios_rounded,
          color: isDarkTheme.value ? Colors.black : theme.primaryColor,
        ),
      );
    }

    Widget buildSettingsButton() {
      return ElevatedButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (BuildContext _) {
              return const MapSettingsDialog();
            },
          );
        },
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
          padding: const EdgeInsets.all(12),
          backgroundColor: isDarkTheme.value ? Colors.white : theme.cardColor,
          foregroundColor: theme.primaryColor,
        ),
        child: Icon(
          Icons.more_vert_rounded,
          color: isDarkTheme.value ? Colors.black : theme.primaryColor,
        ),
      );
    }

    Widget buildAttribution() {
      return RichAttributionWidget(
        animationConfig: const ScaleRAWA(), // Or `FadeRAWA` as is default
        attributions: [
          TextSourceAttribution(
            'OpenStreetMap contributors',
            onTap: () =>
                launchUrl(Uri.parse('https://openstreetmap.org/copyright')),
          ),
          const TextSourceAttribution(
            'This attribution is the same throughout this app, except where otherwise specified',
            prependCopyright: false,
          ),
        ],
      );
    }

    Widget buildTileLayer() {
      Widget tileLayer = TileLayer(
        urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: const ['a', 'b', 'c'],
        maxNativeZoom: 19,
        maxZoom: 19,
      );
      if (!isDarkTheme.value) {
        return tileLayer;
      }
      return InvertionFilter(
        child: SaturationFilter(
          saturation: -1,
          child: BrightnessFilter(
            brightness: -1,
            child: tileLayer,
          ),
        ),
      );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.black.withOpacity(0.5),
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: FlutterMap(
          options: MapOptions(
            center: LatLng(51, 0),
            zoom: 9,
            maxZoom: 19, // max level supported by OSM
          ),
          nonRotatedChildren: [
            Positioned(
              top: 40,
              height: 50,
              left: 10,
              width: 50,
              child: buildBackButton(),
            ),
            Positioned(
              top: 40,
              height: 50,
              right: 10,
              width: 50,
              child: buildSettingsButton(),
            ),
            buildAttribution(),
          ],
          children: [buildTileLayer()],
        ),
      ),
    );
  }
}
