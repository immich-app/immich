import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

@RoutePage()
class PartnerDetailPage extends HookConsumerWidget {
  const PartnerDetailPage({super.key, required this.partner});

  final User partner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inTimeline = useState(partner.inTimeline);
    bool toggleInProcess = false;

    useEffect(
      () {
        ref.read(assetProvider.notifier).getPartnerAssets(partner);
        return null;
      },
      [],
    );

    void toggleInTimeline() async {
      if (toggleInProcess) return;
      toggleInProcess = true;
      try {
        final ok = await ref
            .read(partnerSharedWithProvider.notifier)
            .updatePartner(partner, inTimeline: !inTimeline.value);
        if (ok) {
          inTimeline.value = !inTimeline.value;
          final action = inTimeline.value ? "shown on" : "hidden from";
          ImmichToast.show(
            context: context,
            toastType: ToastType.success,
            durationInSecond: 1,
            msg: "${partner.name}'s assets $action your timeline",
          );
        } else {
          ImmichToast.show(
            context: context,
            toastType: ToastType.error,
            durationInSecond: 1,
            msg: "Failed to toggle the timeline setting",
          );
        }
      } finally {
        toggleInProcess = false;
      }
    }

    return Scaffold(
      appBar: ref.watch(multiselectProvider)
          ? null
          : AppBar(
              title: Text(partner.name),
              elevation: 0,
              centerTitle: false,
              actions: [
                IconButton(
                  onPressed: toggleInTimeline,
                  icon: Icon(
                    inTimeline.value
                        ? Icons.collections
                        : Icons.collections_outlined,
                  ),
                  tooltip: "Show/hide photos on your main timeline",
                ),
              ],
            ),
      body: MultiselectGrid(
        renderListProvider: assetsProvider(partner.isarId),
        onRefresh: () =>
            ref.read(assetProvider.notifier).getPartnerAssets(partner),
        deleteEnabled: false,
        favoriteEnabled: false,
      ),
    );
  }
}
