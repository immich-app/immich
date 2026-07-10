import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class PartnerDetailBottomSheet extends ConsumerWidget {
  const PartnerDetailBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scope = ActionScope.from(context, ref);
    final assets = ref.watch(multiSelectProvider).selectedAssets.toList(growable: false);

    return BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        ActionColumnButtonWidget(
          action: ShareAction(assets: assets, scope: scope),
        ),
        ActionColumnButtonWidget(
          action: TimelineAction(
            action: DownloadAction(assets: assets, scope: scope),
          ),
        ),
      ],
    );
  }
}
