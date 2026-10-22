import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/platform/spherical_video_api.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/panorama_viewer.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class SphericalVideoButton extends ConsumerWidget {
  final BaseAsset asset;

  const SphericalVideoButton({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!CurrentPlatform.isAndroid || !asset.isVideo || !isPanorama(ref, asset)) {
      return const SizedBox.shrink();
    }

    return Positioned.fill(
      child: Center(
        child: IconButton.filled(
          style: IconButton.styleFrom(backgroundColor: Colors.black45, foregroundColor: Colors.white),
          iconSize: 36,
          icon: const Icon(Icons.threesixty_rounded),
          onPressed: () => _openViewer(context, ref),
        ),
      ),
    );
  }

  Future<void> _openViewer(BuildContext context, WidgetRef ref) async {
    final loadOriginal = ref.read(appConfigProvider).viewer.loadOriginalVideo;
    final postfixUrl = loadOriginal ? 'original' : 'video/playback';
    final url = '${Store.get(StoreKey.serverEndpoint)}/assets/${asset.id}/$postfixUrl';

    final opened = await SphericalVideoApi().openViewer(url);
    if (!opened && context.mounted) {
      ImmichToast.show(context: context, msg: context.t.errors.failed_to_load_asset, toastType: ToastType.error);
    }
  }
}
