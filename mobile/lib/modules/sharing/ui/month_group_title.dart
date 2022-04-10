import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class MonthGroupTitle extends HookConsumerWidget {
  final String month;
  final List<ImmichAsset> assetGroup;

  const MonthGroupTitle({Key? key, required this.month, required this.assetGroup}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDateGroup = ref.watch(assetSelectionProvider).selectedMonths;
    final isMonthSelected = useState(false);

    _handleTitleIconClick() {
      HapticFeedback.heavyImpact();

      if (isMonthSelected.value) {
        ref.watch(assetSelectionProvider.notifier).removeAssetsInMonth(month, assetGroup);
        isMonthSelected.value = false;
      } else {
        ref.watch(assetSelectionProvider.notifier).addAssetsInMonth(month, assetGroup);
        isMonthSelected.value = true;
      }
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 29.0, bottom: 29.0, left: 14.0, right: 8.0),
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
            Padding(
              padding: const EdgeInsets.only(left: 8.0),
              child: Text(
                month,
                style: TextStyle(
                  fontSize: 24,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
            // const Spacer(),
            // GestureDetector(
            //   onTap: _handleTitleIconClick,
            //   child: selectedDateGroup.contains(month)
            //       ? Icon(
            //           Icons.check_circle_rounded,
            //           color: Theme.of(context).primaryColor,
            //         )
            //       : const Icon(
            //           Icons.check_circle_outline_rounded,
            //           color: Colors.grey,
            //         ),
            // )
          ],
        ),
      ),
    );
  }
}
