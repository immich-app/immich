import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class AssetDetailBottomSheet extends ConsumerWidget {
  final ScrollController? controller;

  const AssetDetailBottomSheet({this.controller, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);

    return ListView(
      controller: controller,
      children: [
        Text(
          'Asset Details',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        Text(
          'Asset Width / Height: ${asset.width} X ${asset.height}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        Text(
          'Asset Name: ${asset.name}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        Text(
          'Asset Created At: ${asset.createdAt}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        Text(
          'Asset Updated At: ${asset.updatedAt}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        Text(
          'Asset Type: ${asset.type}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}
