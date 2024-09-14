part of 'immich_asset_grid.widget.dart';

class _ImImagePlaceholder extends StatelessWidget {
  const _ImImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    var gradientColors = [
      context.colorScheme.surfaceContainer,
      context.colorScheme.surfaceContainer.darken(amount: .1),
    ];

    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );
  }
}
