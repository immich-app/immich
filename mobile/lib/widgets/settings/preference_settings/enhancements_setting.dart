import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class EnhancementsSetting extends HookConsumerWidget {
  const EnhancementsSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hideAlbumCarousel = useAppSettingsState(AppSettingsEnum.hideAlbumCarousel);
    final defaultLandingPage = useAppSettingsState(AppSettingsEnum.defaultLandingPage);

    // Helper to manage landing page selection
    final isAlbumsLandingPage = useState(defaultLandingPage.value == "albums");

    useEffect(() {
      isAlbumsLandingPage.value = defaultLandingPage.value == "albums";
      return null;
    }, [defaultLandingPage.value]);

    void onHideCarouselChanged(bool value) {
      hideAlbumCarousel.value = value;
    }

    void onLandingPageChanged(bool isAlbums) async {
      final value = isAlbums ? "albums" : "photos";
      defaultLandingPage.value = value;
      isAlbumsLandingPage.value = isAlbums;

      // Show dialog and force app restart
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Reinicio necesario'),
          content: const Text('La aplicación se cerrará para aplicar el cambio. Por favor, vuelve a abrirla.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Force kill the app process completely
                exit(0);
              },
              child: const Text('Aceptar'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: "interface_enhancements".tr(), icon: Icons.auto_fix_high),
        SettingsSwitchListTile(
          valueNotifier: hideAlbumCarousel,
          title: "hide_album_carousel".tr(),
          subtitle: "hide_album_carousel_subtitle".tr(),
          onChanged: onHideCarouselChanged,
        ),
        SwitchListTile(
          value: isAlbumsLandingPage.value,
          onChanged: onLandingPageChanged,
          activeColor: context.primaryColor,
          title: Text(
            "start_on_albums_page".tr(),
            style: context.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(
            isAlbumsLandingPage.value ? "start_on_albums_page_subtitle".tr() : "start_on_albums_page_subtitle".tr(),
            style: context.textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
