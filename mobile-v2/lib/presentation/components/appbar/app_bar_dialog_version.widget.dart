part of 'app_bar_dialog.widget.dart';

class _DialogVersionMessage extends StatefulWidget {
  const _DialogVersionMessage();

  @override
  State createState() => _DialogVersionMessageState();
}

class _DialogVersionMessageState extends State<_DialogVersionMessage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    duration: Durations.medium2,
    vsync: this,
  );
  late final Animation<double> _animation = CurvedAnimation(
    parent: _controller,
    curve: Curves.fastEaseInToSlowEaseOut,
  );

  @override
  void initState() {
    super.initState();
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appInfo = di<AppInfoProvider>().value;

    final String message;
    if (appInfo.isVersionMismatch) {
      message = context.t[appInfo.versionMismatchError];
    } else {
      message = context.t.common.components.appbar.app_version_ok;
    }

    return SizeTransition(
      sizeFactor: _animation,
      axisAlignment: 1.0,
      child: _DialogHighlightedSection(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(SizeConstants.xxs),
          bottomRight: Radius.circular(SizeConstants.xxs),
        ),
        child: Container(
          padding: const EdgeInsets.all(SizeConstants.m),
          width: double.infinity,
          child: Text(
            message,
            style: TextStyle(
              color: context.colorScheme.primary,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
