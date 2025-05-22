import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';

@RoutePage()
class LockedPage extends HookConsumerWidget {
  const LockedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appLifeCycle = useAppLifecycleState();
    final showOverlay = useState(false);
    final authProviderNotifier = ref.read(authProvider.notifier);
    // lock the page when it is destroyed
    useEffect(
      () {
        return () {
          authProviderNotifier.lockPinCode();
        };
      },
      [],
    );

    useEffect(
      () {
        if (context.mounted) {
          if (appLifeCycle == AppLifecycleState.resumed) {
            showOverlay.value = false;
          } else {
            showOverlay.value = true;
          }
        }

        return null;
      },
      [appLifeCycle],
    );

    return Scaffold(
      appBar: ref.watch(multiselectProvider) ? null : const LockPageAppBar(),
      body: showOverlay.value
          ? const SizedBox()
          : MultiselectGrid(
              renderListProvider: lockedTimelineProvider,
              topWidget: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Center(
                  child: Text(
                    'no_locked_photos_message'.tr(),
                    style: context.textTheme.labelLarge,
                  ),
                ),
              ),
              editEnabled: false,
              favoriteEnabled: false,
              unfavorite: false,
              archiveEnabled: false,
              stackEnabled: false,
              unarchive: false,
            ),
    );
  }
}

class LockPageAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const LockPageAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      leading: IconButton(
        onPressed: () {
          ref.read(authProvider.notifier).lockPinCode();
          context.maybePop();
        },
        icon: const Icon(Icons.arrow_back_ios_rounded),
      ),
      centerTitle: true,
      automaticallyImplyLeading: false,
      title: const Text(
        'locked_folder',
      ).tr(),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
