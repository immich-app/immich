import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class PartnerDetailPage extends HookConsumerWidget {
  const PartnerDetailPage({Key? key, required this.partner}) : super(key: key);

  final User partner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(assetsProvider(partner.isarId));

    return Scaffold(
      appBar: AppBar(
        title: Text("${partner.firstName} ${partner.lastName}"),
        elevation: 0,
        centerTitle: false,
      ),
      body: assets.when(
        data: (renderList) => renderList.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                    "It seems ${partner.firstName} does not have any photos...\n"
                    "Or your server version does not match the app version."),
              )
            : ImmichAssetGrid(
                renderList: renderList,
                onRefresh: () => ref.read(assetProvider.notifier).getAllAsset(),
              ),
        error: (e, _) => Text("Error loading partners:\n$e"),
        loading: () => const Center(child: ImmichLoadingIndicator()),
      ),
    );
  }
}
