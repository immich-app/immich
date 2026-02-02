import 'package:flutter/material.dart';
import 'package:showcase/constants.dart';
import 'package:showcase/widgets/sidebar_navigation.dart';

class ShellLayout extends StatelessWidget {
  final Widget child;
  final VoidCallback onThemeToggle;

  const ShellLayout({
    super.key,
    required this.child,
    required this.onThemeToggle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/immich_logo.png', height: 32, width: 32),
            const SizedBox(width: 8),
            Text(
              'immich',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              size: LayoutConstants.iconSizeLarge,
            ),
            onPressed: onThemeToggle,
            tooltip: 'Toggle theme',
          ),
        ],
        shape: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor, width: 1),
        ),
      ),
      body: Row(
        children: [
          const SidebarNavigation(),
          const VerticalDivider(),
          Expanded(child: child),
        ],
      ),
    );
  }
}
