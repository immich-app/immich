import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/daily_title_text.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/monthly_title_text.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController _scrollController = useScrollController();
    List<ImmichAssetGroupByDate> _assetGroup = ref.watch(assetProvider);
    List<Widget> _imageGridGroup = [];

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
            DailyTitleText(isoDate: dateTitle, assetGroup: assetGroup),
          );

          // Add Image Group
          _imageGridGroup.add(
            ImageGrid(assetGroup: assetGroup),
          );
          //
          lastGroupDate = dateTitle;
        }
      }

      return SafeArea(
        child: DraggableScrollbar.semicircle(
          backgroundColor: Theme.of(context).primaryColor,
          controller: _scrollController,
          heightScrollThumb: 48.0,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              ImmichSliverAppBar(
                imageGridGroup: _imageGridGroup,
                onPopBack: onPopBackFromBackupPage,
              ),
              ..._imageGridGroup,
            ],
          ),
        ),
      );
    }

    return Scaffold(
      drawer: const ProfileDrawer(),
      body: _buildBody(),
    );
  }
}
