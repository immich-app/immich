part of 'app_bar_dialog.widget.dart';

class _DialogAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DialogAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Padding(
        padding: EdgeInsets.only(left: 4),
        child: Icon(icon, size: 22),
      ),
      title: Text(label),
      dense: true,
      visualDensity: VisualDensity.standard,
      contentPadding: const EdgeInsets.only(left: 30),
      onTap: onTap,
      minLeadingWidth: 40,
    );
  }
}

class _DialogActionLogs extends StatelessWidget {
  const _DialogActionLogs();

  @override
  Widget build(BuildContext context) {
    return _DialogAction(
      icon: Symbols.article_rounded,
      label: context.t.common.components.appbar.action_logs,
      onTap: () => unawaited(context.navigateTo(LogsRoute())),
    );
  }
}

class _DialogActionSettings extends StatelessWidget {
  const _DialogActionSettings();

  @override
  Widget build(BuildContext context) {
    return _DialogAction(
      icon: Symbols.settings_rounded,
      label: context.t.common.components.appbar.action_settings,
      onTap: () => unawaited(context.navigateTo(SettingsRoute())),
    );
  }
}

class _DialogActionSignOut extends StatelessWidget {
  const _DialogActionSignOut();

  Future<void> _onLogout() async {
    await di<LoginService>().logout();
    await di<AppRouter>().replaceAll([const LoginRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    return _DialogAction(
      icon: Symbols.logout_rounded,
      label: context.t.common.components.appbar.action_signout,
      onTap: () => unawaited(_onLogout()),
    );
  }
}
