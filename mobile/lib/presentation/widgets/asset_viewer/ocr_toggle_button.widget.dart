import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/ocr.provider.dart';

class OcrToggleButton extends ConsumerWidget {
  final BaseAsset asset;
  const OcrToggleButton({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    final hasOcr = asset is RemoteAsset && ref.watch(ocrAssetProvider(asset.id)).valueOrNull?.isNotEmpty == true;
    final showingOcr = ref.watch(assetViewerProvider.select((s) => s.showingOcr));

    return AnimatedSwitcher(
      duration: Durations.short4,
      child: !hasOcr
          ? const SizedBox.shrink()
          : Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 32, bottom: 8),
                child: Material(
                  color: showingOcr ? context.primaryColor : Colors.black.withValues(alpha: 0.4),
                  shape: const CircleBorder(),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: ref.read(assetViewerProvider.notifier).toggleOcr,
                    child: const Padding(
                      padding: EdgeInsets.all(10.0),
                      child: Icon(Icons.text_fields_rounded, size: 22, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
