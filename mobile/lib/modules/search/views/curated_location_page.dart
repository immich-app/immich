import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/explore_grid.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:openapi/api.dart';

class CuratedLocationPage extends HookConsumerWidget {
  const CuratedLocationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<List<CuratedLocationsResponseDto>> curatedLocation =
        ref.watch(getCuratedLocationProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'curated_location_page_title',
          style: TextStyle(
            color: context.primaryColor,
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ).tr(),
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: curatedLocation.when(
        loading: () => const Center(child: ImmichLoadingIndicator()),
        error: (err, stack) => Center(
          child: Text('Error: $err'),
        ),
        data: (curatedLocations) => ExploreGrid(
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
