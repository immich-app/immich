import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:showcase/constants.dart';
import 'package:showcase/routes.dart';

class HomePage extends StatelessWidget {
  final VoidCallback onThemeToggle;

  const HomePage({super.key, required this.onThemeToggle});

  @override
  Widget build(BuildContext context) {
    return Title(
      title: appTitle,
      color: Theme.of(context).colorScheme.primary,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        children: [
          Text(
            appTitle,
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'A collection of Flutter components that are shared across all Immich projects',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w400,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 48),
          ...routesByCategory.entries.map((entry) {
            if (entry.key == AppRouteCategory.root) {
              return const SizedBox.shrink();
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.key.displayName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 16),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: LayoutConstants.gridSpacing,
                    mainAxisSpacing: LayoutConstants.gridSpacing,
                    childAspectRatio: LayoutConstants.gridAspectRatio,
                  ),
                  itemCount: entry.value.length,
                  itemBuilder: (context, index) {
                    return _ComponentCard(route: entry.value[index]);
                  },
                ),
                const SizedBox(height: 48),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _ComponentCard extends StatelessWidget {
  final AppRoute route;

  const _ComponentCard({required this.route});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go(route.path),
      borderRadius: BorderRadius.circular(LayoutConstants.borderRadiusLarge),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                route.icon,
                size: 32,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                route.name,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),

              const SizedBox(height: 8),
              Text(
                route.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.4,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
