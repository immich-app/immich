import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/widgets/shared_link/shared_link_item.dart';

@RoutePage()
class SharedLinkPage extends HookConsumerWidget {
  const SharedLinkPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedLinks = ref.watch(sharedLinksStateProvider);

    useEffect(() {
      ref.read(sharedLinksStateProvider.notifier).fetchLinks();
      return () {
        if (!context.mounted) return;
        ref.invalidate(sharedLinksStateProvider);
      };
    }, []);

    Widget buildNoShares() {
      return Center(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.link_off, size: 100, color: Theme.of(context).colorScheme.onSurface.withAlpha(128)),
            const SizedBox(height: 20),
            const Text("you_dont_have_any_shared_links", style: TextStyle(fontSize: 14)).tr(),
          ],
        ),
      );
    }

    Widget buildSharesList(List<SharedLink> links) {
      return LayoutBuilder(
        builder: (context, constraints) => constraints.maxWidth > 600
            ? GridView.builder(
                key: const PageStorageKey('shared-links-grid'),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisExtent: 180,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                padding: const EdgeInsets.all(12),
                itemCount: links.length,
                itemBuilder: (context, index) => SharedLinkItem(links[index]),
              )
            : ListView.separated(
                key: const PageStorageKey('shared-links-list'),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: links.length,
                itemBuilder: (context, index) => SharedLinkItem(links[index]),
                separatorBuilder: (context, index) => const Divider(height: 1),
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("shared_link_app_bar_title").tr(), elevation: 0, centerTitle: false),
      body: SafeArea(
        child: sharedLinks.widgetWhen(
          onError: (error, stackTrace) => buildNoShares(),
          onData: (links) => links.isNotEmpty ? buildSharesList(links) : buildNoShares(),
        ),
      ),
    );
  }
}
