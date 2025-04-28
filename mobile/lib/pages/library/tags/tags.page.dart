// ignore_for_file: avoid-local-functions, prefer-single-widget-per-file, arguments-ordering, prefer-trailing-comma, prefer-for-loop-in-children, avoid-redundant-else, unnecessary-trailing-comma

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/tags/recursive_tag.model.dart';
import 'package:immich_mobile/models/tags/root_tag.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/tags.provider.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/repositories/tags_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';

@RoutePage()
class TagsPage extends HookConsumerWidget {
  final TagResponseDto? tag;

  const TagsPage({super.key, this.tag});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tagState = ref.watch(tagsProvider);
    final currentTag = useState<TagResponseDto?>(tag);

    useEffect(
      () {
        if (tag == null) {
          ref.read(tagsProvider.notifier).fetchTags();
        }
        return null;
      },
      [],
    );

    // Update current folder when root structure changes
    useEffect(
      () {
        if (tag != null && tagState.hasValue) {
          if (tag != null) {
            currentTag.value = tag;
          }
        }
        return null;
      },
      [tagState],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(currentTag.value?.name ?? tr("tags")),
        elevation: 0,
        centerTitle: false,
        actions: [],
      ),
      body: tagState.when(
        data: (allTags) {
          if (tag == null) {
            return TagsContent(
              current: null,
              subtags:
                  (allTags ?? []).where((x) => x.parentId == null).toList(),
              tags: allTags,
            );
          } else {
            return TagsContent(
              current: currentTag.value!,
              subtags: (allTags ?? [])
                  .where((x) => x.parentId == currentTag.value!.id)
                  .toList(),
              tags: allTags,
            );
          }
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) {
          ImmichToast.show(
            context: context,
            msg: "failed_to_load_tags".tr(),
            toastType: ToastType.error,
          );
          return Center(child: const Text("failed_to_load_tags").tr());
        },
      ),
    );
  }
}

class TagsContent extends HookConsumerWidget {
  final TagResponseDto? current;
  final List<TagResponseDto> tags;
  final List<TagResponseDto> subtags;

  const TagsContent(
      {super.key, this.current, required this.tags, required this.subtags});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Initial asset fetch
    useEffect(
      () {
        if (current == null) return;
        ref.read(tagsRenderListProvider(current!).notifier).fetchAssets();
        return null;
      },
      [current],
    );

    MultiselectGrid buildMultiselectGrid() {
      return MultiselectGrid(
        renderListProvider: tagsRenderListProvider(current),
        favoriteEnabled: true,
        editEnabled: true,
        unfavorite: true,
      );
    }

    ListView buildTagListView() {
      return ListView(
        children: [
          if (subtags.isNotEmpty)
            ...subtags.map(
              (subfolder) => LargeLeadingTile(
                leading: Icon(
                  Icons.folder,
                  color: context.primaryColor,
                  size: 48,
                ),
                title: Text(
                  subfolder.name,
                  softWrap: false,
                  overflow: TextOverflow.ellipsis,
                  style: context.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onTap: () => context.pushRoute(TagsRoute(folder: subfolder)),
              ),
            )
        ],
      );
    }

    return Column(
      children: [
        TagsPath(currentFolder: current, root: tags),
        Expanded(child: buildTagListView()),
        Expanded(child: buildMultiselectGrid()),
      ],
    );
  }
}

class TagsPath extends StatelessWidget {
  final TagResponseDto? currentFolder;
  final List<TagResponseDto> root;

  const TagsPath({
    super.key,
    required this.currentFolder,
    required this.root,
  });

  @override
  Widget build(BuildContext context) {
    if (currentFolder == null) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      alignment: Alignment.centerLeft,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Text(
                currentFolder!.value,
                style: TextStyle(
                  fontFamily: 'Inconsolata',
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: context.colorScheme.onSurface.withAlpha(175),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
