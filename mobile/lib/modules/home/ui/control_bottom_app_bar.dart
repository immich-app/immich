import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';

class ControlBottomAppBar extends ConsumerWidget {
  const ControlBottomAppBar({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Positioned(
      bottom: 0,
      left: 0,
      child: Container(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height * 0.15,
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(8),
            topRight: Radius.circular(8),
          ),
          color: Theme.of(context).scaffoldBackgroundColor.withOpacity(0.95),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ControlBoxButton(
                    iconData: Icons.delete_forever_rounded,
                    label: "control_bottom_app_bar_delete".tr(),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (BuildContext context) {
                          return const DeleteDialog();
                        },
                      );
                    },
                  ),
                  ControlBoxButton(
                    iconData: Icons.share,
                    label: "control_bottom_app_bar_share".tr(),
                    onPressed: () {
                      final homePageState = ref.watch(homePageStateProvider);
                      ref.watch(homePageStateProvider.notifier).shareAssets(
                            homePageState.selectedItems.toList(),
                            context,
                          );
                      ref
                          .watch(homePageStateProvider.notifier)
                          .disableMultiSelect();
                    },
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

class ControlBoxButton extends StatelessWidget {
  const ControlBoxButton({
    Key? key,
    required this.label,
    required this.iconData,
    required this.onPressed,
  }) : super(key: key);

  final String label;
  final IconData iconData;
  final Function onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 60,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: () {
              onPressed();
            },
            icon: Icon(iconData, size: 30),
          ),
          Text(label)
        ],
      ),
    );
  }
}
