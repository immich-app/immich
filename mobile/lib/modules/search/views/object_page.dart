import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/object_assets.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';


class ObjectPage extends HookConsumerWidget {
  final String object;
  const ObjectPage({
    super.key,
    required this.object,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationAssets = ref.watch(objectAssetsProvider(object));

    return Scaffold(
      appBar: AppBar(
        title: Text(object.capitalizeWords()),
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: locationAssets.when(
        data: (assets) => ImmichAssetGrid(
          assets: assets, 
        ),
        error: (e, s) => Text(e.toString()),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}

