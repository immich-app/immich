import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';

@RoutePage()
class CollectionsPage extends StatelessWidget {
  const CollectionsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ImmichAppBar(
        action: CreateNewButton(),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ListView(
          shrinkWrap: true,
          children: [
            Row(
              children: [
                ActionButton(
                  onPressed: () {},
                  icon: Icons.favorite_outline_rounded,
                  label: 'Favorite',
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () {},
                  icon: Icons.delete_outline_rounded,
                  label: 'Trash',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ActionButton(
                  onPressed: () {},
                  icon: Icons.link_outlined,
                  label: 'Shared links',
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () {},
                  icon: Icons.archive_outlined,
                  label: 'Archive',
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                PeopleCollectionCard(),
                AlbumsCollectionCard(),
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: MediaQuery.of(context).size.width * 0.5,
          width: MediaQuery.of(context).size.width * 0.5 - 12,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: context.colorScheme.surfaceContainer,
          ),
          child: people.widgetWhen(
            onData: (people) {
              return GridView.count(
                crossAxisCount: 2,
                padding: const EdgeInsets.only(
                  top: 18,
                  left: 12,
                  right: 12,
                  bottom: 0,
                ),
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
    );
  }
}

class AlbumsCollectionCard extends StatelessWidget {
  const AlbumsCollectionCard({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.width * 0.5,
      width: MediaQuery.of(context).size.width * 0.5 - 12,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: context.colorScheme.surfaceContainer,
      ),
      child: const Center(
        child: Text('Album Collection'),
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
          padding: const EdgeInsets.only(left: 8.0),
          child: Text(
            label,
            style: TextStyle(
              color: context.colorScheme.onSurface,
            ),
          ),
        ),
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.all(16),
          backgroundColor: context.colorScheme.primary.withAlpha(20),
          alignment: Alignment.centerLeft,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(20)),
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
      child: Icon(
        Icons.add,
        size: 32,
        semanticLabel: 'profile_drawer_trash'.tr(),
      ),
    );
  }
}
