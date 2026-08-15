import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class SelectionSliverAppBar extends ConsumerStatefulWidget {
  const SelectionSliverAppBar({super.key});

  @override
  ConsumerState<SelectionSliverAppBar> createState() => _SelectionSliverAppBarState();
}

class _SelectionSliverAppBarState extends ConsumerState<SelectionSliverAppBar> {
  @override
  Widget build(BuildContext context) {
    final selection = ref.watch(multiSelectProvider.select((s) => s.selectedAssets));

    final toExclude = ref.watch(multiSelectProvider.select((s) => s.lockedSelectionAssets));

    final filteredAssets = selection.where((asset) {
      return !toExclude.contains(asset);
    }).toSet();

    void onDone(Set<BaseAsset> selected) {
      ref.read(multiSelectProvider.notifier).reset();
      context.pop<Set<BaseAsset>>(selected);
    }

    return SliverAppBar(
      floating: true,
      pinned: true,
      snap: false,
      backgroundColor: context.colorScheme.surfaceContainer,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(5))),
      automaticallyImplyLeading: false,
      leading: IconButton(
        icon: const Icon(Icons.close_rounded),
        onPressed: () {
          ref.read(multiSelectProvider.notifier).reset();
          context.pop<Set<BaseAsset>>(null);
        },
      ),
      centerTitle: true,
      title: Text(context.t.selected_count(count: filteredAssets.length)),
      actions: [
        TextButton(
          onPressed: () => onDone(filteredAssets),
          child: Text(
            context.t.done,
            style: context.textTheme.titleSmall?.copyWith(color: context.colorScheme.primary),
          ),
        ),
      ],
    );
  }
}
