import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';

class AssetSelectionPage extends HookConsumerWidget {
  const AssetSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController _scrollController = useScrollController();
    var assetGroupMonthYear = ref.watch(assetGroupByMonthYearProvider);
    List<Widget> _imageGridGroup = [];

    Widget _buildBody() {
      assetGroupMonthYear.forEach((key, value) {
        print(key);
      });
      // if (assetGroupByDateTime.isNotEmpty) {
      //   int? lastMonth;

      //   assetGroupByDateTime.forEach((dateGroup, immichAssetList) {
      //     DateTime parseDateGroup = DateTime.parse(dateGroup);
      //     int currentMonth = parseDateGroup.month;

      //     if (lastMonth != null) {
      //       if (currentMonth - lastMonth! != 0) {
      //         _imageGridGroup.add(
      //           MonthlyTitleText(
      //             isoDate: dateGroup,
      //           ),
      //         );
      //       }
      //     }

      //     _imageGridGroup.add(
      //       DailyTitleText(
      //         isoDate: dateGroup,
      //         assetGroup: immichAssetList,
      //       ),
      //     );

      //     _imageGridGroup.add(
      //       ImageGrid(assetGroup: immichAssetList),
      //     );

      //     lastMonth = currentMonth;
      //   });
      // }

      return Stack(
        children: [
          DraggableScrollbar.semicircle(
            backgroundColor: Theme.of(context).primaryColor,
            controller: _scrollController,
            heightScrollThumb: 48.0,
            child: CustomScrollView(
              controller: _scrollController,
              slivers: [..._imageGridGroup],
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () {
            AutoRouter.of(context).pop();
          },
        ),
        title: const Text(
          'Add photos',
          style: TextStyle(fontSize: 18),
        ),
        centerTitle: false,
      ),
      body: _buildBody(),
    );
  }
}
