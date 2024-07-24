import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/widgets/shared_link/shared_link_item.dart';

@RoutePage()
class SharedLinkPage extends HookConsumerWidget {
  const SharedLinkPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedLinks = ref.watch(sharedLinksStateProvider);

    useEffect(
      () {
        ref.read(sharedLinksStateProvider.notifier).fetchLinks();
        return () {
          if (!context.mounted) return;
          ref.invalidate(sharedLinksStateProvider);
        };
      },
      [],
    );

    Widget buildNoShares() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 16.0),
            child: const Text(
              "shared_link_manage_links",
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
                "shared_link_empty",
                style: TextStyle(fontSize: 14),
              ).tr(),
            ),
          ),
          Expanded(
            child: Center(
              child: Icon(
                Icons.link_off,
                size: 100,
                color: context.themeData.iconTheme.color?.withOpacity(0.5),
              ),
            ),
          ),
        ],
      );
    }

    Widget buildSharesList(List<SharedLink> links) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 30.0),
            child: Text(
              "shared_link_manage_links",
              style: context.textTheme.labelLarge?.copyWith(
                color: context.textTheme.labelLarge?.color?.withAlpha(200),
              ),
            ).tr(),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 600) {
                  // Two column
                  return GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisExtent: 180,
                    ),
                    itemCount: links.length,
                    itemBuilder: (context, index) {
                      return SharedLinkItem(links.elementAt(index));
                    },
                  );
                }

                // Single column
                return ListView.builder(
                  itemCount: links.length,
                  itemBuilder: (context, index) {
                    return SharedLinkItem(links.elementAt(index));
                  },
                );
              },
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("shared_link_app_bar_title").tr(),
        elevation: 0,
        centerTitle: false,
      ),
      body: SafeArea(
        child: sharedLinks.widgetWhen(
          onError: (error, stackTrace) => buildNoShares(),
          onData: (links) =>
              links.isNotEmpty ? buildSharesList(links) : buildNoShares(),
        ),
      ),
    );
  }
}
