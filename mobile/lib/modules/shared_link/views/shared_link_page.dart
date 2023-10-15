import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/shared_link/providers/shared_link.provider.dart';
import 'package:immich_mobile/modules/shared_link/ui/shared_link_item.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:openapi/api.dart';

class SharedLinkPage extends HookConsumerWidget {
  const SharedLinkPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedLinks = ref.watch(sharedLinksStateProvider);

    useEffect(
      () {
        ref.read(sharedLinksStateProvider.notifier).fetchLinks();
        return () => ref.invalidate(sharedLinksStateProvider);
      },
      [],
    );

    buildNoShares() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 16.0),
            child: const Text(
              "Manage Shared links",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: const Text(
                "You don't have any shared links",
                style: TextStyle(fontSize: 14),
              ).tr(),
            ),
          ),
        ],
      );
    }

    buildSharesList(List<SharedLinkResponseDto> links) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 30.0),
            child: const Text(
              "Manage Shared links",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: links.length,
              itemBuilder: (context, index) {
                return SharedLinkItem(links.elementAt(index));
              },
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Shared Links").tr(),
        elevation: 0,
        centerTitle: false,
      ),
      body: SafeArea(
        child: sharedLinks.when(
          data: (links) =>
              links.isNotEmpty ? buildSharesList(links) : buildNoShares(),
          error: (error, stackTrace) => buildNoShares(),
          loading: () => const Center(child: ImmichLoadingIndicator()),
        ),
      ),
    );
  }
}
