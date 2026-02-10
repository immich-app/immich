import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:showcase/constants.dart';
import 'package:showcase/routes.dart';

class SidebarNavigation extends StatelessWidget {
  const SidebarNavigation({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: LayoutConstants.sidebarWidth,
      decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface),
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        children: [
          ...routesByCategory.entries.expand((entry) {
            final category = entry.key;
            final routes = entry.value;
            return [
              if (category != AppRouteCategory.root) _CategoryHeader(category),
              ...routes.map((route) => _NavItem(route)),
              const SizedBox(height: 24),
            ];
          }),
        ],
      ),
    );
  }
}

class _CategoryHeader extends StatelessWidget {
  final AppRouteCategory category;

  const _CategoryHeader(this.category);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
      child: Text(
        category.displayName,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final AppRoute route;

  const _NavItem(this.route);

  @override
  Widget build(BuildContext context) {
    final currentRoute = GoRouterState.of(context).uri.toString();
    final isSelected = currentRoute == route.path;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            context.go(route.path);
          },
          borderRadius: BorderRadius.circular(
            LayoutConstants.borderRadiusMedium,
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? (isDark
                        ? Colors.white.withValues(alpha: 0.1)
                        : Theme.of(
                            context,
                          ).colorScheme.primaryContainer.withValues(alpha: 0.5))
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(
                LayoutConstants.borderRadiusMedium,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  route.icon,
                  size: 20,
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    route.name,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
