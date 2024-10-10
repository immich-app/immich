import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/partner.provider.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

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
        Future.microtask(
          () async => {
            await ref.read(assetProvider.notifier).getAllAsset(),
          },
        );
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
            ),
      body: MultiselectGrid(
        topWidget: Padding(
          padding: const EdgeInsets.only(left: 8.0, right: 8.0, top: 16.0),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(
                color: context.colorScheme.onSurface.withAlpha(10),
                width: 1,
              ),
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                colors: [
                  context.colorScheme.primary.withAlpha(10),
                  context.colorScheme.primary.withAlpha(15),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: ListTile(
                title: Text(
                  "Show in timeline",
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.primary,
                  ),
                ),
                subtitle: Text(
                  "Show photos and videos from this user in your timeline",
                  style: context.textTheme.bodyMedium,
                ),
                trailing: Switch(
                  value: inTimeline.value,
                  onChanged: (_) => toggleInTimeline(),
                ),
              ),
            ),
          ),
        ),
        renderListProvider: assetsProvider(partner.isarId),
        onRefresh: () => ref.read(assetProvider.notifier).getAllAsset(),
        deleteEnabled: false,
        favoriteEnabled: false,
      ),
    );
  }
}
