import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/ui/image_grid.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';
import 'package:intl/intl.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ValueNotifier<bool> _showBackToTopBtn = useState(false);
    ScrollController _scrollController = useScrollController();
    List<ImmichAssetGroupByDate> assetGroup = ref.watch(assetProvider);
    BackUpState _backupState = ref.watch(backupProvider);
    List<Widget> imageGridGroup = [];
    List<GlobalKey> monthGroupKey = [];

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

      return () => _scrollController.removeListener(_scrollControllerCallback);
    }, [_scrollController, key]);

    Widget _buildBody() {
      if (assetGroup.isNotEmpty) {
        String lastGroupDate = assetGroup[0].date;

        for (var group in assetGroup) {
          var dateTitle = group.date;
          var assetGroup = group.assets;

          int? currentMonth = DateTime.tryParse(dateTitle)?.month;
          int? previousMonth = DateTime.tryParse(lastGroupDate)?.month;

          if ((currentMonth! - previousMonth!) != 0) {
            var myKey = GlobalKey();
            monthGroupKey.add(myKey);
            // debugPrint("Group Key $myKey");

            imageGridGroup.add(
              SliverToBoxAdapter(
                key: myKey,
                child: Padding(
                  padding: const EdgeInsets.only(left: 10.0, top: 32),
                  child: Text(
                    DateFormat('MMMM, y').format(
                      DateTime.parse(dateTitle),
                    ),
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ),
              ),
            );
          }

          imageGridGroup.add(
            _buildDateGroupTitle(dateTitle),
          );

          imageGridGroup.add(ImageGrid(assetGroup: assetGroup));

          lastGroupDate = dateTitle;
        }

        return SafeArea(
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              ImmichSliverAppBar(imageGridGroup: imageGridGroup),
              ...imageGridGroup,
            ],
          ),
        );
      } else {
        return Container();
      }
    }

    return Scaffold(
      drawer: const ProfileDrawer(),
      body: _buildBody(),
      bottomNavigationBar: BottomAppBar(
        child: IconButton(
          onPressed: () {
            if (monthGroupKey.isNotEmpty) {
              var targetContext = monthGroupKey.last.currentContext;
              if (targetContext != null) {
                Scrollable.ensureVisible(
                  targetContext,
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeInOut,
                );
              }
            }
          },
          icon: const Icon(Icons.ac_unit_outlined),
        ),
      ),
      floatingActionButton: _showBackToTopBtn.value
          ? FloatingActionButton.small(
              enableFeedback: true,
              backgroundColor: Theme.of(context).secondaryHeaderColor,
              foregroundColor: Theme.of(context).primaryColor,
              onPressed: () {
                _scrollController.animateTo(0, duration: const Duration(seconds: 1), curve: Curves.easeOutExpo);
              },
              child: const Icon(Icons.keyboard_arrow_up_rounded),
            )
          : null,
    );
  }

  SliverToBoxAdapter _buildDateGroupTitle(String dateTitle) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(dateTitle).year;
    var formatDateTemplate = currentYear == groupYear ? 'E, MMM dd' : 'E, MMM dd, yyyy';
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 24.0, bottom: 24.0, left: 3.0),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 8.0, bottom: 5.0, top: 5.0),
              child: Text(
                DateFormat(formatDateTemplate).format(DateTime.parse(dateTitle)),
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
