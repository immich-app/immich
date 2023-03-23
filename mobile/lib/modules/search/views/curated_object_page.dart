import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/explore_grid.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';
import 'package:openapi/api.dart';

class CuratedObjectPage extends HookConsumerWidget {
  const CuratedObjectPage({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<List<CuratedObjectsResponseDto>> curatedObjects =
        ref.watch(getCuratedObjectProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'curated_object_page_title',
          style: TextStyle(
            color: Theme.of(context).primaryColor,
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ).tr(),
      ),
      body: curatedObjects.when(
        loading: () => const Center(child: ImmichLoadingIndicator()),
        error: (err, stack) => Center(
          child: Text('Error: $err'),
        ),
        data: (curatedLocations) => ExploreGrid(
          curatedContent: curatedLocations
              .map(
                (l) => CuratedContent(
                  label: l.object.capitalizeFirstLetter(),
                  id: l.id,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
