import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/people.utils.dart';

class SheetPeopleDetails extends ConsumerStatefulWidget {
  const SheetPeopleDetails({super.key});

  @override
  ConsumerState createState() => _SheetPeopleDetailsState();
}

class _SheetPeopleDetailsState extends ConsumerState<SheetPeopleDetails> {
  @override
  Widget build(BuildContext context) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final peopleFuture = ref.watch(driftPeopleAssetProvider(asset.id));

    return peopleFuture.when(
      data: (people) {
        return AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 16, top: 16, bottom: 16),
                child: Text(
                  "people".t(context: context).toUpperCase(),
                  style: context.textTheme.labelMedium?.copyWith(
                    color: context.textTheme.labelMedium?.color?.withAlpha(200),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SizedBox(
                height: 160,
                child: ListView(
                  padding: const EdgeInsets.only(left: 16.0),
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final person in people)
                      _PeopleAvatar(
                        person: person,
                        assetFileCreatedAt: asset.createdAt,
                        onTap: () {
                          final previousRouteData = ref.read(previousRouteDataProvider);
                          final previousRouteArgs = previousRouteData?.arguments;

                          // Prevent circular navigation
                          if (previousRouteArgs is DriftPersonRouteArgs &&
                              previousRouteArgs.initialPerson.id == person.id) {
                            context.back();
                            return;
                          }
                          context.pop();
                          context.pushRoute(DriftPersonRoute(initialPerson: person));
                        },
                        onNameTap: () async {
                          // Needs to be before the modal, as this overwrites the previousRouteDataProvider
                          final previousRouteData = ref.read(previousRouteDataProvider);
                          final previousRouteArgs = previousRouteData?.arguments;
                          final previousPersonId = previousRouteArgs is DriftPersonRouteArgs
                              ? previousRouteArgs.initialPerson.id
                              : null;

                          DriftPerson? newPerson = await showNameEditModal(context, person);

                          // If the name edit resulted in a new person (e.g. from merging)
                          // And if we are currently nested below the drift person page if said
                          // old person id, we need to pop, otherwise the timeline provider complains
                          // and the asset viewer goes black
                          // TODO: Preferably we would replace the timeline provider, and let it listen to the new person id (Relevant function is the ```TimelineService person(String userId, String personId)``` in timeline.service.dart)
                          if (newPerson != null && newPerson.id != person.id && previousPersonId == person.id) {
                            await context.maybePop();
                          }

                          ref.invalidate(driftPeopleAssetProvider(asset.id));
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),
          crossFadeState: people.isEmpty ? CrossFadeState.showFirst : CrossFadeState.showSecond,
          duration: Durations.short4,
        );
      },
      error: (error, stack) => Text("error_loading_people".t(context: context), style: context.textTheme.bodyMedium),
      loading: () => const SizedBox.shrink(),
    );
  }
}

class _PeopleAvatar extends StatelessWidget {
  final DriftPerson person;
  final DateTime assetFileCreatedAt;
  final VoidCallback? onTap;
  final VoidCallback? onNameTap;
  final double imageSize = 96;

  const _PeopleAvatar({required this.person, required this.assetFileCreatedAt, this.onTap, this.onNameTap});

  @override
  Widget build(BuildContext context) {
    final headers = ApiService.getRequestHeaders();

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 96),
      child: Padding(
        padding: const EdgeInsets.only(right: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: onTap,
              child: SizedBox(
                height: imageSize,
                child: Material(
                  shape: CircleBorder(side: BorderSide(color: context.primaryColor.withAlpha(50), width: 1.0)),
                  shadowColor: context.colorScheme.shadow,
                  elevation: 3,
                  child: CircleAvatar(
                    maxRadius: imageSize / 2,
                    backgroundImage: NetworkImage(getFaceThumbnailUrl(person.id), headers: headers),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            if (person.name.isEmpty)
              GestureDetector(
                onTap: () => onNameTap?.call(),
                child: Text(
                  "add_a_name".t(context: context),
                  style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              )
            else
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    person.name,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: context.textTheme.labelLarge,
                    maxLines: 1,
                  ),
                  if (person.birthDate != null)
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        formatAge(person.birthDate!, assetFileCreatedAt),
                        textAlign: TextAlign.center,
                        style: context.textTheme.bodyMedium?.copyWith(
                          color: context.textTheme.bodyMedium?.color?.withAlpha(175),
                        ),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
