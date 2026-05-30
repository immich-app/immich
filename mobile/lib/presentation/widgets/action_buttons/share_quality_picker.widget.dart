import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/utils/share_asset.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

/// Shows a bottom sheet letting the user pick the quality used for sharing.
///
/// Resolves to the chosen [ShareAssetQuality], or `null` when the sheet is
/// dismissed without making a choice (sharing should then be aborted).
Future<ShareAssetQuality?> showShareQualityPicker(BuildContext context) {
  return showModalBottomSheet<ShareAssetQuality>(
    context: context,
    useRootNavigator: false,
    builder: (_) => const _ShareQualityPicker(),
  );
}

class _ShareQualityPicker extends StatelessWidget {
  const _ShareQualityPicker();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'share_quality_title'.t(context: context),
                style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.high_quality_outlined),
            title: Text('share_quality_original'.t(context: context)),
            subtitle: Text('share_quality_original_subtitle'.t(context: context)),
            onTap: () => Navigator.of(context).pop(ShareAssetQuality.original),
          ),
          ListTile(
            leading: const Icon(Icons.image_outlined),
            title: Text('share_quality_preview'.t(context: context)),
            subtitle: Text('share_quality_preview_subtitle'.t(context: context)),
            onTap: () => Navigator.of(context).pop(ShareAssetQuality.preview),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
