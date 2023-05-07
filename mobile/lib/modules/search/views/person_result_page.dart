import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class PersonResultPage extends HookConsumerWidget {
  const PersonResultPage({
    super.key,
    required this.personId,
    required this.personName,
  });

  final String personId;
  final String personName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final personAssets = ref.watch(getPersonAssetsProvider(personId));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          personName,
          style: TextStyle(
            color: Theme.of(context).primaryColor,
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ),
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: personAssets.when(
        data: (personAssets) => ImmichAssetGrid(
          assets: personAssets.map(Asset.remote).toList(),
        ),
        loading: () => const Center(child: ImmichLoadingIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
