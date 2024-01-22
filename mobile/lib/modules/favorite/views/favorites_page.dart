import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';

@RoutePage()
class FavoritesPage extends HookConsumerWidget {
  const FavoritesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AppBar buildAppBar() {
      return AppBar(
        leading: IconButton(
          onPressed: () => context.popRoute(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'favorites_page_title',
        ).tr(),
      );
    }

    return Scaffold(
      appBar: ref.watch(multiselectProvider) ? null : buildAppBar(),
      body: MultiselectGrid(
        renderListProvider: favoriteAssetsProvider,
        favoriteEnabled: true,
        editEnabled: true,
        unfavorite: true,
      ),
    );
  }
}
