import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/explore_grid.dart';
import 'package:openapi/api.dart';

class CuratedLocationPage extends HookConsumerWidget {
  const CuratedLocationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<List<CuratedLocationsResponseDto>> curatedLocation =
        ref.watch(getCuratedLocationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'curated_location_page_title',
        ).tr(),
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: curatedLocation.widgetWhen(
        onData: (curatedLocations) => ExploreGrid(
          curatedContent: curatedLocations
              .map(
                (l) => CuratedContent(
                  label: l.city,
                  id: l.id,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
