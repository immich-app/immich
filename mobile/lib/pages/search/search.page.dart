import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';

@RoutePage()
// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  const SearchPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    TextStyle categoryTitleStyle = const TextStyle(
      fontWeight: FontWeight.w500,
      fontSize: 15.0,
    );

    Color categoryIconColor = context.colorScheme.onSurface;

    buildSearchButton() {
      return GestureDetector(
        onTap: () {
          context.pushRoute(SearchInputRoute());
        },
        child: Card(
          elevation: 0,
          color: context.colorScheme.surfaceContainerHigh,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(50),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 12.0,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.search,
                  color: context.colorScheme.onSurfaceSecondary,
                ),
                const SizedBox(width: 16.0),
                Text(
                  "search_bar_hint",
                  style: context.textTheme.bodyLarge?.copyWith(
                    color: context.colorScheme.onSurfaceSecondary,
                    fontWeight: FontWeight.w400,
                  ),
                ).tr(),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: const ImmichAppBar(),
      body: ListView(
        children: [
          buildSearchButton(),
          const SizedBox(height: 24.0),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'search_page_categories',
              style: context.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ).tr(),
          ),
          const SizedBox(height: 12.0),
          ListTile(
            leading: Icon(
              Icons.favorite_border_rounded,
              color: categoryIconColor,
            ),
            title:
                Text('search_page_favorites', style: categoryTitleStyle).tr(),
            onTap: () => context.pushRoute(const FavoritesRoute()),
          ),
          const CategoryDivider(),
          ListTile(
            leading: Icon(
              Icons.schedule_outlined,
              color: categoryIconColor,
            ),
            title: Text(
              'search_page_recently_added',
              style: categoryTitleStyle,
            ).tr(),
            onTap: () => context.pushRoute(const RecentlyAddedRoute()),
          ),
          const CategoryDivider(),
          ListTile(
            title: Text('search_page_videos', style: categoryTitleStyle).tr(),
            leading: Icon(
              Icons.play_circle_outline,
              color: categoryIconColor,
            ),
            onTap: () => context.pushRoute(const AllVideosRoute()),
          ),
          const CategoryDivider(),
          ListTile(
            title: Text(
              'search_page_motion_photos',
              style: categoryTitleStyle,
            ).tr(),
            leading: Icon(
              Icons.motion_photos_on_outlined,
              color: categoryIconColor,
            ),
            onTap: () => context.pushRoute(const AllMotionPhotosRoute()),
          ),
        ],
      ),
    );
  }
}

class CategoryDivider extends StatelessWidget {
  const CategoryDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(
        left: 56,
        right: 16,
      ),
      child: Divider(
        height: 0,
      ),
    );
  }
}
