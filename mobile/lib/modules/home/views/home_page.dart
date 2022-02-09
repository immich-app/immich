import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/home/ui/daily_title_text.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/monthly_title_text.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:sliver_tools/sliver_tools.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController _scrollController = useScrollController();
    List<ImmichAssetGroupByDate> _assetGroup = ref.watch(assetProvider);
    List<Widget> _imageGridGroup = [];
    var isMultiSelectEnable = ref.watch(homePageStateProvider).isMultiSelectEnable;
    var homePageState = ref.watch(homePageStateProvider);

    _scrollControllerCallback() {
      var endOfPage = _scrollController.position.maxScrollExtent;

      if (_scrollController.offset >= endOfPage - (endOfPage * 0.1) && !_scrollController.position.outOfRange) {
        ref.read(assetProvider.notifier).getOlderAsset();
      }
    }

    useEffect(() {
      ref.read(assetProvider.notifier).getImmichAssets();

      _scrollController.addListener(_scrollControllerCallback);
      return () {
        _scrollController.removeListener(_scrollControllerCallback);
      };
    }, []);

    onPopBackFromBackupPage() {
      ref.read(assetProvider.notifier).getNewAsset();
      // Remove and force getting new widget again if there is not many widget on screen.
      // Otherwise do nothing.

      if (_imageGridGroup.isNotEmpty && _imageGridGroup.length < 20) {
        ref.read(assetProvider.notifier).getOlderAsset();
      } else if (_imageGridGroup.isEmpty) {
        ref.read(assetProvider.notifier).getImmichAssets();
      }
    }

    Widget _buildBody() {
      if (_assetGroup.isNotEmpty) {
        String lastGroupDate = _assetGroup[0].date;

        for (var group in _assetGroup) {
          var dateTitle = group.date;
          var assetGroup = group.assets;

          int? currentMonth = DateTime.tryParse(dateTitle)?.month;
          int? previousMonth = DateTime.tryParse(lastGroupDate)?.month;

          // Add Monthly Title Group if started at the beginning of the month

          if (currentMonth != null && previousMonth != null) {
            if ((currentMonth - previousMonth) != 0) {
              _imageGridGroup.add(
                MonthlyTitleText(isoDate: dateTitle),
              );
            }
          }

          // Add Daily Title Group
          _imageGridGroup.add(
            DailyTitleText(
              isoDate: dateTitle,
              assetGroup: assetGroup,
            ),
          );

          // Add Image Group
          _imageGridGroup.add(
            ImageGrid(assetGroup: assetGroup),
          );
          //
          lastGroupDate = dateTitle;
        }
      }

      _buildDisableMultiSelectButton() {
        return Positioned(
          top: 0,
          left: 0,
          child: Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 46),
            child: Material(
              elevation: 20,
              borderRadius: BorderRadius.circular(35),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(35),
                  color: Colors.grey[100],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: TextButton.icon(
                      onPressed: () {
                        ref.watch(homePageStateProvider.notifier).disableMultiSelect();
                      },
                      icon: const Icon(Icons.close_rounded),
                      label: Text(
                        homePageState.selectedItems.length.toString(),
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
                      )),
                ),
              ),
            ),
          ),
        );
      }

      _buildControlBottomBar() {
        return Positioned(
          bottom: 0,
          left: 0,
          child: Container(
            width: MediaQuery.of(context).size.width,
            height: MediaQuery.of(context).size.height * 0.15,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(15), topRight: Radius.circular(15)),
              color: Colors.grey[300]?.withOpacity(0.98),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 60,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            IconButton(
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (BuildContext context) {
                                    return AlertDialog(
                                      backgroundColor: Colors.grey[200],
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                      title: const Text("Delete Permanently"),
                                      content: const Text(
                                          "These items will be permanently deleted from Immich and from your device"),
                                      actions: [
                                        TextButton(
                                          onPressed: () {
                                            Navigator.of(context).pop();
                                          },
                                          child: const Text(
                                            "Cancel",
                                            style: TextStyle(color: Colors.blueGrey),
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () {},
                                          child: Text(
                                            "Delete",
                                            style: TextStyle(color: Colors.red[400]),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              },
                              icon: const Icon(
                                Icons.delete_forever_rounded,
                                size: 30,
                              ),
                            ),
                            const Text(
                              "Delete",
                              softWrap: true,
                            )
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
          ),
        );
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
            isMultiSelectEnable ? _buildDisableMultiSelectButton() : Container(),
            isMultiSelectEnable ? _buildControlBottomBar() : Container(),
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
