part of 'app_bar_dialog.widget.dart';

class _DialogStorageSection extends StatelessWidget {
  const _DialogStorageSection();

  @override
  Widget build(BuildContext context) {
    final user = di<CurrentUserProvider>().value;

    final int availableSizeInBytes;
    final int usedSizeInBytes;
    if (user.quotaSizeInBytes > 0) {
      availableSizeInBytes = user.quotaSizeInBytes;
      usedSizeInBytes = user.quotaUsageInBytes;
    } else {
      final storage = di<ServerInfoProvider>().value.disk;
      availableSizeInBytes = storage.diskSizeInBytes;
      usedSizeInBytes = storage.diskUseInBytes;
    }

    final percentageUsed = usedSizeInBytes / availableSizeInBytes;

    return _DialogHighlightedSection(
      child: ListTile(
        leading: Padding(
          padding: EdgeInsets.only(left: SizeConstants.s),
          child: Icon(
            Symbols.hard_drive_rounded,
            color: context.colorScheme.primary,
          ),
        ),
        title: Text(
          context.t.common.components.appbar.server_storage,
          style: AppTypography.titleMedium.copyWith(
            fontSize: SizeConstants.xxs,
            fontWeight: FontWeight.w400,
          ),
        ),
        subtitle: Padding(
          padding: EdgeInsets.only(top: SizeConstants.s),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LinearProgressIndicator(
                value: percentageUsed,
                minHeight: 5,
                borderRadius: const BorderRadius.all(Radius.circular(10.0)),
              ),
              Padding(
                padding: EdgeInsets.only(top: SizeConstants.s),
                child: Text(context.t.common.components.appbar.storage_used(
                  used: usedSizeInBytes.formatAsSize(noOfDecimals: 1),
                  total: availableSizeInBytes.formatAsSize(),
                )),
              ),
            ],
          ),
        ),
        minLeadingWidth: SizeConstants.xl,
      ),
    );
  }
}
