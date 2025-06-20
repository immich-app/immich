import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class SyncAlbumsSetting extends HookConsumerWidget {
  const SyncAlbumsSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAlbumSyncInProgress = useState(false);

    Future<void> syncAlbums() async {
      isAlbumSyncInProgress.value = true;
      try {
        await ref.read(assetServiceProvider).syncUploadedAssetToAlbums();
      } catch (_) {
      } finally {
        Future.delayed(const Duration(seconds: 1), () {
          isAlbumSyncInProgress.value = false;
        });
      }
    }

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingButtonListTile(
          title: 'sync_albums'.t(context: context),
          subtileText: "sync_albums_manual_subtitle".t(context: context),
          buttonText: 'sync'.t(context: context),
          child: ResponsiveButton(
            onPressed: !isAlbumSyncInProgress.value ? syncAlbums : null,
            child: isAlbumSyncInProgress.value
                ? const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'sync'.t(context: context),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
