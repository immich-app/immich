import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/home/ui/control_bottom_app_bar.dart';
import 'package:immich_mobile/modules/home/ui/daily_title_text.dart';
import 'package:immich_mobile/modules/home/ui/disable_multi_select_button.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/monthly_title_text.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:sliver_tools/sliver_tools.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController _scrollController = useScrollController();
    var assetGroupByDateTime = ref.watch(assetGroupByDateTimeProvider);
    List<Widget> _imageGridGroup = [];
    var isMultiSelectEnable = ref.watch(homePageStateProvider).isMultiSelectEnable;
    var homePageState = ref.watch(homePageStateProvider);

    useEffect(() {
      ref.read(websocketProvider.notifier).connect();
      ref.read(assetProvider.notifier).getAllAsset();
      return null;
    }, []);

    onPopBackFromBackupPage() {
      // ref.read(assetProvider.notifier).getAllAsset();
    }

    Widget _buildBody() {
      if (assetGroupByDateTime.isNotEmpty) {
        int? lastMonth;

        assetGroupByDateTime.forEach((dateGroup, immichAssetList) {
          DateTime parseDateGroup = DateTime.parse(dateGroup);
          int currentMonth = parseDateGroup.month;

          if (lastMonth != null) {
            if (currentMonth - lastMonth! != 0) {
              _imageGridGroup.add(
                MonthlyTitleText(
                  isoDate: dateGroup,
                ),
              );
            }
          }

          _imageGridGroup.add(
            DailyTitleText(
              isoDate: dateGroup,
              assetGroup: immichAssetList,
            ),
          );

          _imageGridGroup.add(
            ImageGrid(assetGroup: immichAssetList),
          );

          lastMonth = currentMonth;
        });
      }

      return SafeArea(
        bottom: !isMultiSelectEnable,
        top: !isMultiSelectEnable,
        child: Stack(
          children: [
            DraggableScrollbar.semicircle(
              backgroundColor: Theme.of(context).primaryColor,
              controller: _scrollController,
              heightScrollThumb: 48.0,
              child: CustomScrollView(
                controller: _scrollController,
                slivers: [
                  SliverAnimatedSwitcher(
                    child: isMultiSelectEnable
                        ? const SliverToBoxAdapter(
                            child: SizedBox(
                              height: 70,
                              child: null,
                            ),
                          )
                        : ImmichSliverAppBar(
                            imageGridGroup: _imageGridGroup,
                            onPopBack: onPopBackFromBackupPage,
                          ),
                    duration: const Duration(milliseconds: 350),
                  ),
                  ..._imageGridGroup
                ],
              ),
            ),
            isMultiSelectEnable
                ? DisableMultiSelectButton(
                    onPressed: ref.watch(homePageStateProvider.notifier).disableMultiSelect,
                    selectedItemCount: homePageState.selectedItems.length,
                  )
                : Container(),
            isMultiSelectEnable ? const ControlBottomAppBar() : Container(),
          ],
        ),
      );
    }

    return Scaffold(
      // key: _scaffoldKey,
      drawer: const ProfileDrawer(),
      body: _buildBody(),
    );
  }
}
