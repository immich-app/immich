import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';
import 'package:immich_mobile/widgets/common/share_partner_button.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class CollectionsPage extends ConsumerWidget {
  const CollectionsPage({super.key});
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
                  label: 'Favorite',
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () => context.pushRoute(const ArchiveRoute()),
                  icon: Icons.archive_outlined,
                  label: 'Archive',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ActionButton(
                  onPressed: () => context.pushRoute(const SharedLinkRoute()),
                  icon: Icons.link_outlined,
                  label: 'Shared links',
                ),
                const SizedBox(width: 8),
                trashEnabled
                    ? ActionButton(
                        onPressed: () => context.pushRoute(const TrashRoute()),
                        icon: Icons.delete_outline_rounded,
                        label: 'Trash',
                      )
                    : const SizedBox.shrink(),
              ],
            ),
            const SizedBox(height: 24),
            const Wrap(
              spacing: 8,
              runSpacing: 16,
              children: [
                PeopleCollectionCard(),
                AlbumsCollectionCard(),
                AlbumsCollectionCard(
                  isLocal: true,
                ),
                PlacesCollectionCard(),
              ],
            ),
          ],
        ),
      ),
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
            child: Text('People', style: context.textTheme.labelLarge),
          ),
        ],
      ),
    );
  }
}

class AlbumsCollectionCard extends ConsumerWidget {
  final bool isLocal;

  const AlbumsCollectionCard({super.key, this.isLocal = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = isLocal
        ? ref.watch(albumProvider).where((album) => album.isLocal)
        : ref.watch(albumProvider).where((album) => album.isRemote);
    final size = MediaQuery.of(context).size.width * 0.5 - 20;
    return GestureDetector(
      onTap: () => context.pushRoute(
        isLocal
            ? const LocalAlbumsCollectionRoute()
            : const AlbumsCollectionRoute(),
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
              isLocal ? 'On this device' : 'Albums',
              style: context.textTheme.labelLarge,
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
            child: Text('Places', style: context.textTheme.labelLarge),
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
              fontSize: 14,
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
