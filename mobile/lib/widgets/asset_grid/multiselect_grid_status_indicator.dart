import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/render_list_status_provider.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';

class MultiselectGridStatusIndicator extends HookConsumerWidget {
  const MultiselectGridStatusIndicator({
    super.key,
    this.buildLoadingIndicator,
    this.emptyIndicator,
  });

  final Widget Function()? buildLoadingIndicator;
  final Widget? emptyIndicator;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final renderListStatus = ref.watch(renderListStatusProvider);
    return switch (renderListStatus) {
      RenderListStatusEnum.loading => buildLoadingIndicator == null
          ? const Center(
              child: DelayedLoadingIndicator(
                delay: Duration(milliseconds: 500),
              ),
            )
          : buildLoadingIndicator!(),
      RenderListStatusEnum.empty =>
        emptyIndicator ?? Center(child: const Text("no_assets_to_show").tr()),
      RenderListStatusEnum.error =>
        Center(child: const Text("error_loading_assets").tr()),
      RenderListStatusEnum.complete => const SizedBox()
    };
  }
}
