import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:openapi/api.dart';

class MonthGroupTitle extends HookConsumerWidget {
  final String month;
  final List<AssetResponseDto> assetGroup;

  const MonthGroupTitle({
    Key? key,
    required this.month,
    required this.assetGroup,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDateGroup = ref.watch(assetSelectionProvider).selectedMonths;
    final selectedAssets =
        ref.watch(assetSelectionProvider).selectedNewAssetsForAlbum;
    final isAlbumExist = ref.watch(assetSelectionProvider).isAlbumExist;

    _handleTitleIconClick() {
      HapticFeedback.heavyImpact();

      if (isAlbumExist) {
        if (selectedDateGroup.contains(month)) {
          ref
              .watch(assetSelectionProvider.notifier)
              .removeAssetsInMonth(month, []);
          ref
              .watch(assetSelectionProvider.notifier)
              .removeSelectedAdditionalAssets(assetGroup);
        } else {
          ref
              .watch(assetSelectionProvider.notifier)
              .addAllAssetsInMonth(month, []);

          // Deep clone assetGroup
          var assetGroupWithNewItems = [...assetGroup];

          for (var selectedAsset in selectedAssets) {
            assetGroupWithNewItems.removeWhere((a) => a.id == selectedAsset.id);
          }

          ref
              .watch(assetSelectionProvider.notifier)
              .addAdditionalAssets(assetGroupWithNewItems);
        }
      } else {
        if (selectedDateGroup.contains(month)) {
          ref
              .watch(assetSelectionProvider.notifier)
              .removeAssetsInMonth(month, assetGroup);
        } else {
          ref
              .watch(assetSelectionProvider.notifier)
              .addAllAssetsInMonth(month, assetGroup);
        }
      }
    }

    _getSimplifiedMonth() {
      var monthAndYear = month.split(',');
      var yearText = monthAndYear[1].trim();
      var monthText = monthAndYear[0].trim();
      var currentYear = DateTime.now().year.toString();

      if (yearText == currentYear) {
        return monthText;
      } else {
        return month;
      }
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(
          top: 29.0,
          bottom: 29.0,
          left: 14.0,
          right: 8.0,
        ),
        child: Row(
          children: [
            GestureDetector(
              onTap: _handleTitleIconClick,
              child: selectedDateGroup.contains(month)
                  ? Icon(
                      Icons.check_circle_rounded,
                      color: Theme.of(context).primaryColor,
                    )
                  : const Icon(
                      Icons.circle_outlined,
                      color: Colors.grey,
                    ),
            ),
            GestureDetector(
              onTap: _handleTitleIconClick,
              child: Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  _getSimplifiedMonth(),
                  style: TextStyle(
                    fontSize: 24,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
