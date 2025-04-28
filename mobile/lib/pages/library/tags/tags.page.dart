// ignore_for_file: avoid-local-functions, prefer-single-widget-per-file, arguments-ordering, prefer-trailing-comma, prefer-for-loop-in-children, avoid-redundant-else, unnecessary-trailing-comma, function-always-returns-null

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
  final TagResponseDto? initalTag;

  const TagsPage({super.key, this.initalTag});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTag = useState<TagResponseDto?>(initalTag);
    final tagsProviderWatcher = ref.watch(tagsProvider);

    useEffect(
      () {
        ref.read(tagsProvider.notifier).fetchTags();
        if (currentTag.value != null) {
          ref
              .read(tagsRenderListProvider(currentTag.value).notifier)
              .fetchAssets();
        }
      },
      [tagsProviderWatcher],
    );

    void selectTag(TagResponseDto selectedTag) {
      currentTag.value = selectedTag;
      //context.pushRoute(TagsRoute(folder: selectedTag)
    }

    Widget getDrawerItem(TagResponseDto tag, List<TagResponseDto> allTags) {
      List<TagResponseDto> subfolders =
          allTags.where((x) => x.parentId == tag.id).toList();
      if (subfolders.isEmpty) {
        return LargeLeadingTile(
            leading: Icon(Icons.folder, color: context.primaryColor, size: 24),
            title: Text(
              tag.name,
              softWrap: false,
              overflow: TextOverflow.ellipsis,
              style: context.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            onTap: () => selectTag(tag));
      } else {
        return ExpansionTile(
            leading: Icon(Icons.folder, color: context.primaryColor, size: 24),
            minTileHeight: 0,
            title: GestureDetector(
                onTap: () => selectTag(tag),
                child: Container(
                    decoration: const BoxDecoration(color: Colors.transparent),
                    child: Text(
                      tag.name,
                      softWrap: false,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ))),
            children: [
              ...subfolders
                  .map((subfolder) => getDrawerItem(subfolder, allTags))
            ]);
      }
    }

    ListView getListView(List<TagResponseDto>? allTags) {
      List<TagResponseDto> tagList = (allTags ?? []);
      List<TagResponseDto> rootTags =
          tagList.where((x) => x.parentId == null).toList();

      return ListView(
        children: [
          if (rootTags.isNotEmpty)
            ...rootTags.map((subfolder) => getDrawerItem(subfolder, tagList))
        ],
      );
    }

    Widget buildTagDrawer() {
      return Drawer(
          child: tagsProviderWatcher.when(
              data: (alltags) => getListView(alltags),
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
              }));
    }

    MultiselectGrid buildMultiselectGrid() {
      return MultiselectGrid(
        renderListProvider: tagsRenderListProvider(currentTag.value),
        favoriteEnabled: true,
        editEnabled: true,
        unfavorite: true,
      );
    }

    return Scaffold(
        appBar: AppBar(
          title: Text(currentTag.value?.name ?? tr("tags")),
          elevation: 0,
          centerTitle: false,
          actions: [],
        ),
        drawer: buildTagDrawer(),
        body: buildMultiselectGrid());
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
