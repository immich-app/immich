import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';
import 'package:immich_mobile/modules/search/ui/explore_grid.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class AllPeoplePage extends HookConsumerWidget {
  const AllPeoplePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final curatedPeople = ref.watch(getCuratedPeopleProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'all_people_page_title',
          style: TextStyle(
            color: Theme.of(context).primaryColor,
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ).tr(),
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: curatedPeople.when(
        loading: () => const Center(child: ImmichLoadingIndicator()),
        error: (err, stack) => Center(
          child: Text('Error: $err'),
        ),
        data: (people) => ExploreGrid(
          isPeople: true,
          curatedContent: people
              .map(
                (person) => CuratedContent(
                  label: person.name,
                  id: person.id,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
