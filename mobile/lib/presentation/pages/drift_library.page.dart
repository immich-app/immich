import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/local_album_thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/people/partner_user_avatar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/partner.provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class DriftLibraryPage extends ConsumerWidget {
  const DriftLibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Scaffold(
      body: CustomScrollView(
        slivers: [
          ImmichSliverAppBar(snap: false, floating: false, pinned: true, showUploadButton: false),
          _ActionButtonGrid(),
          _CollectionCards(),
          _QuickAccessButtonList(),
        ],
      ),
    );
  }
}

class _ActionButtonGrid extends ConsumerWidget {
  const _ActionButtonGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));

    return SliverPadding(
      padding: const EdgeInsets.only(left: 16, top: 16, right: 16, bottom: 12),
      sliver: SliverToBoxAdapter(
        child: Column(
          children: [
            Row(
              children: [
                _ActionButton(
                  icon: Icons.favorite_outline_rounded,
                  onTap: () => context.pushRoute(const DriftFavoriteRoute()),
                  label: 'favorites'.t(context: context),
                ),
                const SizedBox(width: 8),
                _ActionButton(
                  icon: Icons.archive_outlined,
                  onTap: () => context.pushRoute(const DriftArchiveRoute()),
                  label: 'archived'.t(context: context),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _ActionButton(
                  icon: Icons.link_outlined,
                  onTap: () => context.pushRoute(const SharedLinkRoute()),
                  label: 'shared_links'.t(context: context),
                ),
                isTrashEnable ? const SizedBox(width: 8) : const SizedBox.shrink(),
                isTrashEnable
                    ? _ActionButton(
                        icon: Icons.delete_outline_rounded,
                        onTap: () => context.pushRoute(const DriftTrashRoute()),
                        label: 'trash'.t(context: context),
                      )
                    : const SizedBox.shrink(),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({required this.icon, required this.onTap, required this.label});

  final IconData icon;
  final VoidCallback onTap;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: FilledButton.icon(
        onPressed: onTap,
        label: Padding(
          padding: const EdgeInsets.only(left: 4.0),
          child: Text(label, style: TextStyle(color: context.colorScheme.onSurface, fontSize: 15)),
        ),
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          backgroundColor: context.colorScheme.surfaceContainerLow,
          alignment: Alignment.centerLeft,
          shape: RoundedRectangleBorder(
            borderRadius: const BorderRadius.all(Radius.circular(25)),
            side: BorderSide(color: context.colorScheme.onSurface.withAlpha(10), width: 1),
          ),
        ),
        icon: Icon(icon, color: context.primaryColor),
      ),
    );
  }
}

class _CollectionCards extends StatelessWidget {
  const _CollectionCards();

  @override
  Widget build(BuildContext context) {
    return const SliverPadding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [_PeopleCollectionCard(), _PlacesCollectionCard(), _LocalAlbumsCollectionCard()],
        ),
      ),
    );
  }
}

class _PeopleCollectionCard extends ConsumerWidget {
  const _PeopleCollectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(driftGetAllPeopleProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final widthFactor = isTablet ? 0.25 : 0.5;
        final size = context.width * widthFactor - 20.0;

        return GestureDetector(
          onTap: () => context.pushRoute(const DriftPeopleCollectionRoute()),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: size,
                width: size,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.all(Radius.circular(20)),
                  gradient: LinearGradient(
                    colors: [context.colorScheme.primary.withAlpha(30), context.colorScheme.primary.withAlpha(25)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: people.widgetWhen(
                  onLoading: () => const Center(child: CircularProgressIndicator()),
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
                  'people'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PlacesCollectionCard extends StatelessWidget {
  const _PlacesCollectionCard();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final widthFactor = isTablet ? 0.25 : 0.5;
        final size = context.width * widthFactor - 20.0;

        return GestureDetector(
          onTap: () => context.pushRoute(DriftPlaceRoute(currentLocation: null)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: size,
                width: size,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(20)),
                    color: context.colorScheme.secondaryContainer.withAlpha(100),
                  ),
                  child: IgnorePointer(
                    child: MapThumbnail(
                      zoom: 8,
                      centre: const LatLng(21.44950, -157.91959),
                      showAttribution: false,
                      themeMode: context.isDarkTheme ? ThemeMode.dark : ThemeMode.light,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  'places'.t(),
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _LocalAlbumsCollectionCard extends ConsumerWidget {
  const _LocalAlbumsCollectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(localAlbumProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final widthFactor = isTablet ? 0.25 : 0.5;
        final size = context.width * widthFactor - 20.0;

        return GestureDetector(
          onTap: () => context.pushRoute(const DriftLocalAlbumsRoute()),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: size,
                width: size,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(20)),
                    gradient: LinearGradient(
                      colors: [context.colorScheme.primary.withAlpha(30), context.colorScheme.primary.withAlpha(25)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: GridView.count(
                    crossAxisCount: 2,
                    padding: const EdgeInsets.all(12),
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    physics: const NeverScrollableScrollPhysics(),
                    children: albums.when(
                      data: (data) {
                        return data.take(4).map((album) {
                          return LocalAlbumThumbnail(albumId: album.id);
                        }).toList();
                      },
                      error: (error, _) {
                        return [
                          Center(child: Text('error_saving_image'.tr(args: [error.toString()]))),
                        ];
                      },
                      loading: () {
                        return [const Center(child: CircularProgressIndicator())];
                      },
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  'on_this_device'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _QuickAccessButtonList extends ConsumerWidget {
  const _QuickAccessButtonList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partnerSharedWithAsync = ref.watch(driftSharedWithPartnerProvider);
    final partners = partnerSharedWithAsync.valueOrNull ?? [];

    return SliverPadding(
      padding: const EdgeInsets.only(left: 16, top: 12, right: 16, bottom: 32),
      sliver: SliverToBoxAdapter(
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: context.colorScheme.onSurface.withAlpha(10), width: 1),
            borderRadius: const BorderRadius.all(Radius.circular(20)),
            gradient: LinearGradient(
              colors: [
                context.colorScheme.primary.withAlpha(10),
                context.colorScheme.primary.withAlpha(15),
                context.colorScheme.primary.withAlpha(20),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.all(0),
            physics: const NeverScrollableScrollPhysics(),
            children: [
              ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(20),
                    topRight: const Radius.circular(20),
                    bottomLeft: Radius.circular(partners.isEmpty ? 20 : 0),
                    bottomRight: Radius.circular(partners.isEmpty ? 20 : 0),
                  ),
                ),
                leading: const Icon(Icons.folder_outlined, size: 26),
                title: Text(
                  'folders'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
                ),
                onTap: () => context.pushRoute(FolderRoute()),
              ),
              ListTile(
                leading: const Icon(Icons.lock_outline_rounded, size: 26),
                title: Text(
                  'locked_folder'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
                ),
                onTap: () => context.pushRoute(const DriftLockedFolderRoute()),
              ),
              ListTile(
                leading: const Icon(Icons.group_outlined, size: 26),
                title: Text(
                  'partners'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
                ),
                onTap: () => context.pushRoute(const DriftPartnerRoute()),
              ),
              _PartnerList(partners: partners),
            ],
          ),
        ),
      ),
    );
  }
}

class _PartnerList extends StatelessWidget {
  const _PartnerList({required this.partners});

  final List<PartnerUserDto> partners;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(0),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: partners.length,
      shrinkWrap: true,
      itemBuilder: (context, index) {
        final partner = partners[index];
        final isLastItem = index == partners.length - 1;
        return ListTile(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(isLastItem ? 20 : 0),
              bottomRight: Radius.circular(isLastItem ? 20 : 0),
            ),
          ),
          contentPadding: const EdgeInsets.only(left: 12.0, right: 18.0),
          leading: PartnerUserAvatar(partner: partner),
          title: const Text(
            "partner_list_user_photos",
            style: TextStyle(fontWeight: FontWeight.w500),
          ).t(context: context, args: {'user': partner.name}),
          onTap: () => context.pushRoute(DriftPartnerDetailRoute(partner: partner)),
        );
      },
    );
  }
}
