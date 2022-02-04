import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
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
    final scrollLabelText = useState("");

    _scrollControllerCallback() {
      var endOfPage = _scrollController.position.maxScrollExtent;

      if (_scrollController.offset >= endOfPage - (endOfPage * 0.1) && !_scrollController.position.outOfRange) {
        ref.read(assetProvider.notifier).getMoreAsset();
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
        debugPrint("Remove scroll listener");
        _scrollController.removeListener(_scrollControllerCallback);
      };
    }, []);

    SliverToBoxAdapter _buildDateGroupTitle(String dateTitle) {
      var currentYear = DateTime.now().year;
      var groupYear = DateTime.parse(dateTitle).year;
      var formatDateTemplate = currentYear == groupYear ? 'E, MMM dd' : 'E, MMM dd, yyyy';
      var dateText = DateFormat(formatDateTemplate).format(DateTime.parse(dateTitle));

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

    Widget _buildBody() {
      if (assetGroup.isNotEmpty) {
        String lastGroupDate = assetGroup[0].date;

        for (var group in assetGroup) {
          var dateTitle = group.date;
          var assetGroup = group.assets;

          int? currentMonth = DateTime.tryParse(dateTitle)?.month;
          int? previousMonth = DateTime.tryParse(lastGroupDate)?.month;

          // Add Monthly Title Group if started at the beginning of the month
          if ((currentMonth! - previousMonth!) != 0) {
            var monthTitleText = DateFormat('MMMM, y').format(DateTime.parse(dateTitle));

            imageGridGroup.add(
              MonthlyTitleText(monthTitleText: monthTitleText),
            );
          }

          // Add Daily Title Group
          imageGridGroup.add(
            DailyTitleText(dateTitle: dateTitle),
          );

          // Add Image Group
          imageGridGroup.add(
            ImageGrid(assetGroup: assetGroup),
          );

          lastGroupDate = dateTitle;
        }
      }

      return SafeArea(
        child: DraggableScrollbar.semicircle(
          // labelTextBuilder: (offset) {
          //   final int currentItem = _scrollController.hasClients
          //       ? (_scrollController.offset / _scrollController.position.maxScrollExtent * imageGridGroup.length)
          //           .floor()
          //       : 0;

          //   if (imageGridGroup[currentItem] is MonthlyTitleText) {
          //     MonthlyTitleText item = imageGridGroup[currentItem] as MonthlyTitleText;

          //     scrollLabelText.value = item.monthTitleText;
          //   }

          //   return Text(scrollLabelText.value);
          // },
          // labelConstraints: const BoxConstraints.tightFor(width: 200.0, height: 30.0),
          backgroundColor: Theme.of(context).primaryColor,
          controller: _scrollController,
          heightScrollThumb: 48.0,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              ImmichSliverAppBar(imageGridGroup: imageGridGroup),
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
    required this.monthTitleText,
  }) : super(key: key);

  final String monthTitleText;

  @override
  Widget build(BuildContext context) {
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
    required this.dateTitle,
  }) : super(key: key);

  final String dateTitle;

  @override
  Widget build(BuildContext context) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(dateTitle).year;
    var formatDateTemplate = currentYear == groupYear ? 'E, MMM dd' : 'E, MMM dd, yyyy';
    var dateText = DateFormat(formatDateTemplate).format(DateTime.parse(dateTitle));

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
