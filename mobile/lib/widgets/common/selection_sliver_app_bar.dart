import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class SelectionSliverAppBar extends ConsumerWidget {
  const SelectionSliverAppBar({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selection = ref.watch(
      multiSelectProvider.select((s) => s.selectedAssets),
    );

    final toExclude = ref.read(timelineArgsProvider).lockSelectionIds;

    final filteredAssets = selection.where((asset) {
      final remoteAsset = asset as RemoteAsset;
      return !toExclude.contains(remoteAsset.id);
    }).toSet();

    return SliverAppBar(
      floating: true,
      pinned: true,
      snap: false,
      backgroundColor: context.colorScheme.surfaceContainer,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(5)),
      ),
      automaticallyImplyLeading: true,
      centerTitle: true,
      title: Text(
        "Select {count}".t(
          context: context,
          args: {
            'count': filteredAssets.length.toString(),
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            context.maybePop<Set<BaseAsset>>(filteredAssets);
          },
          child: Text(
            'done'.t(context: context),
            style: context.textTheme.titleSmall?.copyWith(
              color: context.colorScheme.primary,
            ),
          ),
        ),
      ],
    );
  }
}
