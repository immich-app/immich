import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class AssetDetailBottomSheet extends ConsumerWidget {
  final ScrollController? controller;

  const AssetDetailBottomSheet({this.controller, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);

    return CustomScrollView(
      controller: controller,
      slivers: [
        PinnedHeaderSliver(
          child: _DragHandle(
            size: Size(30, 5),
            color: context.colorScheme.surfaceDim,
            radius: 10,
          ),
        ),
        SliverList.list(
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
        ),
      ],
    );
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle({
    this.color,
    this.size,
    this.radius = 8.0,
  });

  final Color? color;
  final Size? size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Center(
        child: Container(
          height: size?.height,
          width: size?.width,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            color: color,
          ),
        ),
      ),
    );
  }
}
