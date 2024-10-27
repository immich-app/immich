part of 'app_bar_dialog.widget.dart';

class _DialogServerSection extends StatelessWidget {
  const _DialogServerSection();

  @override
  Widget build(BuildContext context) {
    return const _DialogHighlightedSection(
      child: Padding(
        padding: EdgeInsets.symmetric(
          vertical: SizeConstants.xxs,
          horizontal: SizeConstants.s,
        ),
        child: Column(
          children: [
            _DialogServerAppVersion(),
            _DialogServerEntryDivider(),
            _DialogServerVersion(),
            _DialogServerEntryDivider(),
            _DialogServerUrl(),
          ],
        ),
      ),
    );
  }
}

class _DialogServerEntryDivider extends StatelessWidget {
  const _DialogServerEntryDivider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConstants.s),
      child: Divider(thickness: 1),
    );
  }
}

class _DialogServerEntry extends StatelessWidget {
  final String label;
  final String value;

  const _DialogServerEntry({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: SizeConstants.xs),
            child: Text(
              label,
              style: TextStyle(fontWeight: FontWeight.w400),
            ),
          ),
        ),
        Expanded(
          flex: 0,
          child: Container(
            padding: const EdgeInsets.only(right: SizeConstants.xs),
            width: context.width * RatioConstants.half,
            child: Text(
              value,
              style: TextStyle(
                color: context.colorScheme.onSurface.darken(
                  amount: RatioConstants.oneThird,
                ),
                fontWeight: FontWeight.bold,
                overflow: TextOverflow.ellipsis,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ),
      ],
    );
  }
}

class _DialogServerAppVersion extends StatelessWidget {
  const _DialogServerAppVersion();

  @override
  Widget build(BuildContext context) {
    final version = di<AppInfoProvider>().value.versionString;

    return _DialogServerEntry(
      label: context.t.common.components.appbar.app_version_label,
      value: version,
    );
  }
}

class _DialogServerVersion extends StatelessWidget {
  const _DialogServerVersion();

  @override
  Widget build(BuildContext context) {
    final version = di<ServerInfoProvider>().value.version;

    return _DialogServerEntry(
      label: context.t.common.components.appbar.server_version_label,
      value: "${version.major}.${version.minor}.${version.patch}",
    );
  }
}

class _DialogServerUrl extends StatelessWidget {
  const _DialogServerUrl();

  @override
  Widget build(BuildContext context) {
    final serverUrl = di<ImApiClient>().basePath.replaceAll("/api", "");

    return _DialogServerEntry(
      label: context.t.common.components.appbar.server_url_label,
      value: serverUrl,
    );
  }
}
