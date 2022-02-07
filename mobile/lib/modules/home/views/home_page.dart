import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:intl/intl.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ValueNotifier<bool> _showBackToTopBtn = useState(false);
    ScrollController _scrollController = useScrollController();

    List<ImmichAssetGroupByDate> assetGroup = ref.watch(assetProvider);
    List<Widget> imageGridGroup = [];

    _scrollControllerCallback() {
      var endOfPage = _scrollController.position.maxScrollExtent;

      if (_scrollController.offset >= endOfPage - (endOfPage * 0.1) && !_scrollController.position.outOfRange) {
        ref.read(assetProvider.notifier).getOlderAsset();
      }

      if (_scrollController.offset >= 400) {
        _showBackToTopBtn.value = true;
      } else {
        _showBackToTopBtn.value = false;
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

      if (imageGridGroup.isNotEmpty && imageGridGroup.length < 20) {
        ref.read(assetProvider.notifier).getOlderAsset();
      } else if (imageGridGroup.isEmpty) {
        ref.read(assetProvider.notifier).getImmichAssets();
      }
    }

    Widget _buildBody() {
      if (assetGroup.isNotEmpty) {
        String lastGroupDate = assetGroup[0].date;

        for (var group in assetGroup) {
          var dateTitle = group.date;
          var assetGroup = group.assets;

          int? currentMonth = DateTime.tryParse(dateTitle)?.month;
          int? previousMonth = DateTime.tryParse(lastGroupDate)?.month;

          // Add Monthly Title Group if started at the beginning of the month

          if (currentMonth != null && previousMonth != null) {
            if ((currentMonth - previousMonth) != 0) {
              imageGridGroup.add(
                MonthlyTitleText(isoDate: dateTitle),
              );
            }
          }

          // Add Daily Title Group
          imageGridGroup.add(
            DailyTitleText(isoDate: dateTitle),
          );

          // Add Image Group
          imageGridGroup.add(
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
                imageGridGroup: imageGridGroup,
                onPopBack: onPopBackFromBackupPage,
              ),
              ...imageGridGroup,
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

class MonthlyTitleText extends StatelessWidget {
  const MonthlyTitleText({
    Key? key,
    required this.isoDate,
  }) : super(key: key);

  final String isoDate;

  @override
  Widget build(BuildContext context) {
    var monthTitleText = DateFormat('MMMM, y').format(DateTime.parse(isoDate));

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(left: 10.0, top: 32),
        child: Text(
          monthTitleText,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).primaryColor,
          ),
        ),
      ),
    );
  }
}

class DailyTitleText extends StatelessWidget {
  const DailyTitleText({
    Key? key,
    required this.isoDate,
  }) : super(key: key);

  final String isoDate;

  @override
  Widget build(BuildContext context) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(isoDate).year;
    var formatDateTemplate = currentYear == groupYear ? 'E, MMM dd' : 'E, MMM dd, yyyy';
    var dateText = DateFormat(formatDateTemplate).format(DateTime.parse(isoDate));

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 24.0, bottom: 24.0, left: 3.0),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 8.0, bottom: 5.0, top: 5.0),
              child: Text(
                dateText,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
