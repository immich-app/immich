import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/partner.provider.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';
import 'package:immich_mobile/widgets/common/share_partner_button.dart';
import 'package:immich_mobile/widgets/common/user_avatar.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class LibraryPage extends ConsumerWidget {
  const LibraryPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));

    return Scaffold(
      appBar: const ImmichAppBar(
        showUploadButton: false,
        actions: [CreateNewButton(), SharePartnerButton()],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16),
        child: ListView(
          shrinkWrap: true,
          children: [
            Row(
              children: [
                ActionButton(
                  onPressed: () => context.pushRoute(const FavoritesRoute()),
                  icon: Icons.favorite_outline_rounded,
                  label: 'favorites'.tr(),
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () => context.pushRoute(const ArchiveRoute()),
                  icon: Icons.archive_outlined,
                  label: 'archived'.tr(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ActionButton(
                  onPressed: () => context.pushRoute(const SharedLinkRoute()),
                  icon: Icons.link_outlined,
                  label: 'shared_links'.tr(),
                ),
                const SizedBox(width: 8),
                trashEnabled
                    ? ActionButton(
                        onPressed: () => context.pushRoute(const TrashRoute()),
                        icon: Icons.delete_outline_rounded,
                        label: 'trash'.tr(),
                      )
                    : const SizedBox.shrink(),
              ],
            ),
            const SizedBox(height: 12),
            const Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                PeopleCollectionCard(),
                LocalAlbumsCollectionCard(),
                PlacesCollectionCard(),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: Icon(
                Icons.schedule_rounded,
                size: 26,
              ),
              title: Text(
                'recently_added'.tr(),
                style: context.textTheme.titleSmall?.copyWith(
                  color: context.colorScheme.onSurface,
                  fontWeight: FontWeight.w500,
                ),
              ),
              onTap: () => context.pushRoute(const RecentlyAddedRoute()),
            ),
            Divider(),
            PartnerList(),
          ],
        ),
      ),
    );
  }
}

class PartnerList extends ConsumerWidget {
  const PartnerList({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partners = ref.watch(partnerSharedWithProvider);
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      separatorBuilder: (context, index) {
        return Divider();
      },
      itemCount: partners.length,
      shrinkWrap: true,
      itemBuilder: (context, index) {
        final partner = partners[index];
        return ListTile(
          contentPadding: const EdgeInsets.only(
            left: 12.0,
            right: 18.0,
          ),
          leading: userAvatar(context, partner, radius: 16),
          title: Text(
            "partner_list_user_photos",
            style: context.textTheme.titleSmall?.copyWith(
              color: context.colorScheme.onSurface,
              fontWeight: FontWeight.w500,
            ),
          ).tr(
            namedArgs: {
              'user': partner.name,
            },
          ),
          onTap: () => context.pushRoute(
            (PartnerDetailRoute(partner: partner)),
          ),
        );
      },
    );
  }
}

class PeopleCollectionCard extends ConsumerWidget {
  const PeopleCollectionCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(getAllPeopleProvider);
    final size = MediaQuery.of(context).size.width * 0.5 - 20;
    return GestureDetector(
      onTap: () => context.pushRoute(const PeopleCollectionRoute()),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: size,
            width: size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: context.colorScheme.secondaryContainer.withAlpha(100),
            ),
            child: people.widgetWhen(
              onData: (people) {
                return GridView.count(
                  crossAxisCount: 2,
                  padding: const EdgeInsets.all(12),
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  physics: const NeverScrollableScrollPhysics(),
                  children: people.take(4).map((person) {
                    return CircleAvatar(
                      backgroundImage: NetworkImage(
                        getFaceThumbnailUrl(person.id),
                        headers: ApiService.getRequestHeaders(),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'people'.tr(),
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.onSurface,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LocalAlbumsCollectionCard extends HookConsumerWidget {
  const LocalAlbumsCollectionCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(localAlbumsProvider);

    final size = MediaQuery.of(context).size.width * 0.5 - 20;

    return GestureDetector(
      onTap: () => context.pushRoute(
        const LocalAlbumsRoute(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: size,
            width: size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: context.colorScheme.secondaryContainer.withAlpha(100),
            ),
            child: GridView.count(
              crossAxisCount: 2,
              padding: const EdgeInsets.all(12),
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              physics: const NeverScrollableScrollPhysics(),
              children: albums.take(4).map((album) {
                return AlbumThumbnailCard(
                  album: album,
                  showTitle: false,
                );
              }).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'on_this_device'.tr(),
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.onSurface,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PlacesCollectionCard extends StatelessWidget {
  const PlacesCollectionCard({super.key});
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size.width * 0.5 - 20;
    return GestureDetector(
      onTap: () => context.pushRoute(const PlacesCollectionRoute()),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: size,
            width: size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: context.colorScheme.secondaryContainer.withAlpha(100),
            ),
            child: IgnorePointer(
              child: MapThumbnail(
                zoom: 8,
                centre: const LatLng(
                  21.44950,
                  -157.91959,
                ),
                showAttribution: false,
                themeMode:
                    context.isDarkTheme ? ThemeMode.dark : ThemeMode.light,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'places'.tr(),
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.onSurface,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ActionButton extends StatelessWidget {
  final VoidCallback onPressed;
  final IconData icon;
  final String label;

  const ActionButton({
    super.key,
    required this.onPressed,
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: FilledButton.icon(
        onPressed: onPressed,
        label: Padding(
          padding: const EdgeInsets.only(left: 4.0),
          child: Text(
            label,
            style: TextStyle(
              color: context.colorScheme.onSurface,
              fontSize: 15,
            ),
          ),
        ),
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          backgroundColor: context.colorScheme.surfaceContainerLow,
          alignment: Alignment.centerLeft,
          shape: RoundedRectangleBorder(
            borderRadius: const BorderRadius.all(Radius.circular(25)),
            side: BorderSide(
              color: context.colorScheme.onSurface.withAlpha(10),
              width: 1,
            ),
          ),
        ),
        icon: Icon(
          icon,
          color: context.primaryColor,
        ),
      ),
    );
  }
}

class CreateNewButton extends StatelessWidget {
  const CreateNewButton({super.key});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      borderRadius: const BorderRadius.all(Radius.circular(25)),
      child: const Icon(
        Icons.add,
        size: 32,
      ),
    );
  }
}
