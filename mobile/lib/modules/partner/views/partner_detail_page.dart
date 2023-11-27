import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class PartnerDetailPage extends HookConsumerWidget {
  const PartnerDetailPage({Key? key, required this.partner}) : super(key: key);

  final User partner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(assetsProvider(partner.isarId));
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
      appBar: AppBar(
        title: Text(partner.name),
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: toggleInTimeline,
            icon: Icon(
              inTimeline.value ? Icons.collections : Icons.collections_outlined,
            ),
            tooltip: "Show/hide photos on your main timeline",
          ),
        ],
      ),
      body: assets.widgetWhen(
        onData: (renderList) => renderList.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                    "It seems ${partner.name} does not have any photos...\n"
                    "Or your server version does not match the app version."),
              )
            : ImmichAssetGrid(
                renderList: renderList,
                onRefresh: () =>
                    ref.read(assetProvider.notifier).getPartnerAssets(partner),
              ),
      ),
    );
  }
}
