import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';

class HomeBottomAppBar extends ConsumerWidget {
  const HomeBottomAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const BaseDraggableScrollableSheet(
      actions: [
        ShareActionButton(),
      ],
    );
  }
}

class BaseDraggableScrollableSheet extends ConsumerWidget {
  final List<Widget> actions;

  const BaseDraggableScrollableSheet({super.key, required this.actions});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      initialChildSize: 0.35,
      minChildSize: 0.24,
      maxChildSize: 0.65,
      snap: true,
      builder: (BuildContext context, ScrollController scrollController) {
        return Card(
          color: context.colorScheme.surfaceContainerHigh,
          surfaceTintColor: context.colorScheme.surfaceContainerHigh,
          borderOnForeground: false,
          clipBehavior: Clip.antiAlias,
          elevation: 6.0,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(6),
              topRight: Radius.circular(6),
            ),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 0),
          child: CustomScrollView(
            controller: scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    const _DragHandle(),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 120,
                      child: ListView(
                        shrinkWrap: true,
                        scrollDirection: Axis.horizontal,
                        children: actions,
                      ),
                    ),
                    // if (hasRemote && !isInLockedView) ...[
                    //   const Divider(
                    //     indent: 16,
                    //     endIndent: 16,
                    //     thickness: 1,
                    //   ),
                    //   _AddToAlbumTitleRow(
                    //     onCreateNewAlbum: enabled ? onCreateNewAlbum : null,
                    //   ),
                    // ],
                  ],
                ),
              ),
              // if (hasRemote && !isInLockedView)
              //   SliverPadding(
              //     padding: const EdgeInsets.symmetric(horizontal: 16),
              //     sliver: AddToAlbumSliverList(
              //       albums: albums,
              //       sharedAlbums: sharedAlbums,
              //       onAddToAlbum: onAddToAlbum,
              //       enabled: enabled,
              //     ),
              //   ),
            ],
          ),
        );
      },
    );
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 6,
      width: 32,
      decoration: BoxDecoration(
        color: context.themeData.dividerColor,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
      ),
    );
  }
}
