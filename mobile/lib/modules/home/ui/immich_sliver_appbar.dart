import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';

import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';

class ImmichSliverAppBar extends ConsumerWidget {
  const ImmichSliverAppBar({
    Key? key,
    required this.imageGridGroup,
  }) : super(key: key);

  final List<Widget> imageGridGroup;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final BackUpState _backupState = ref.watch(backupProvider);

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
      sliver: SliverAppBar(
        centerTitle: true,
        floating: true,
        pinned: false,
        snap: false,
        backgroundColor: Colors.grey[200],
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(5))),
        leading: Builder(
          builder: (BuildContext context) {
            return IconButton(
              icon: const Icon(Icons.account_circle_rounded),
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
              tooltip: MaterialLocalizations.of(context).openAppDrawerTooltip,
            );
          },
        ),
        title: Text(
          'IMMICH',
          style: GoogleFonts.snowburstOne(
            textStyle: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: Theme.of(context).primaryColor,
            ),
          ),
        ),
        actions: [
          Stack(
            alignment: AlignmentDirectional.center,
            children: [
              _backupState.backupProgress == BackUpProgressEnum.inProgress
                  ? Positioned(
                      top: 10,
                      right: 12,
                      child: SizedBox(
                        height: 8,
                        width: 8,
                        child: CircularProgressIndicator(
                          strokeWidth: 1,
                          valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                        ),
                      ),
                    )
                  : Container(),
              IconButton(
                icon: const Icon(Icons.backup_rounded),
                tooltip: 'Backup Controller',
                onPressed: () async {
                  var onPop = await AutoRouter.of(context).push(const BackupControllerRoute());

                  // Fetch new image
                  if (onPop == true) {
                    // Remove and force getting new widget again
                    if (imageGridGroup.isNotEmpty) {
                      ref.read(assetProvider.notifier).getMoreAsset();
                    } else {
                      ref.read(assetProvider.notifier).getImmichAssets();
                    }
                  }
                },
              ),
              _backupState.backupProgress == BackUpProgressEnum.inProgress
                  ? Positioned(
                      bottom: 5,
                      child: Text(
                        _backupState.backingUpAssetCount.toString(),
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    )
                  : Container()
            ],
          ),
        ],
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
    );
  }
}
