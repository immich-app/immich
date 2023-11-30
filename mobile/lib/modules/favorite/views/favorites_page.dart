import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class FavoritesPage extends HookConsumerWidget {
  const FavoritesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectionEnabledHook = useState(false);
    final selection = useState(<Asset>{});
    final processing = useState(false);

    void selectionListener(
      bool multiselect,
      Set<Asset> selectedAssets,
    ) {
      selectionEnabledHook.value = multiselect;
      selection.value = selectedAssets;
    }

    AppBar buildAppBar() {
      return AppBar(
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'favorites_page_title',
        ).tr(),
      );
    }

    void unfavorite() async {
      try {
        if (selection.value.isNotEmpty) {
          await handleFavoriteAssets(
            ref,
            context,
            selection.value.toList(),
            shouldFavorite: false,
          );
        }
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    Widget buildBottomBar() {
      return SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: SizedBox(
            height: 64,
            child: Card(
              child: ListTile(
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
                leading: const Icon(
                  Icons.star_border,
                ),
                title: const Text(
                  "Unfavorite",
                  style: TextStyle(fontSize: 14),
                ),
                onTap: processing.value ? null : unfavorite,
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: buildAppBar(),
      body: ref.watch(favoriteAssetsProvider).widgetWhen(
            onData: (data) => data.isEmpty
                ? Center(
                    child: Text('favorites_page_no_favorites'.tr()),
                  )
                : Stack(
                    children: [
                      ImmichAssetGrid(
                        renderList: data,
                        selectionActive: selectionEnabledHook.value,
                        listener: selectionListener,
                      ),
                      if (selectionEnabledHook.value) buildBottomBar(),
                    ],
                  ),
          ),
    );
  }
}
