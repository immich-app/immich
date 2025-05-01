import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/widgets/search/explore_grid.dart';

@RoutePage()
class AllPeoplePage extends HookConsumerWidget {
  const AllPeoplePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final curatedPeople = ref.watch(getAllPeopleProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'people',
        ).tr(),
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: curatedPeople.widgetWhen(
        onData: (people) => ExploreGrid(
          isPeople: true,
          curatedContent: people
              .map((e) => SearchCuratedContent(label: e.name, id: e.id))
              .toList(),
        ),
      ),
    );
  }
}
