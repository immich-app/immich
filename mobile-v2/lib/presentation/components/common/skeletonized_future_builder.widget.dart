import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';
import 'package:skeletonizer/skeletonizer.dart';

class SkeletonizedFutureBuilder<T> extends StatelessWidget {
  const SkeletonizedFutureBuilder({
    super.key,
    required this.future,
    required this.builder,
    required this.loadingBuilder,
    required this.errorBuilder,
    this.emptyBuilder,
    this.emptyWhen,
  }) : assert(
            (emptyBuilder == null && emptyWhen == null) ||
                (emptyBuilder != null && emptyWhen != null),
            "Both emptyBuilder and emptyWhen should be provided");

  /// Future to listen to
  final Future<T> future;

  /// Callback when data is available
  final Widget Function(BuildContext context, T? snapshot) builder;

  /// Callback when future is loading. Expected a skeletonizer to be returned
  final Widget Function(BuildContext context) loadingBuilder;

  /// Callback when future resulted in an error
  final Widget Function(BuildContext context, Object? error) errorBuilder;

  /// Callback when data is available but is empty. Emptiness is determined based on the [emptyWhen] callback
  final Widget Function(BuildContext context)? emptyBuilder;

  /// Predicate to call [emptyBuilder] when the [data] passes the filter
  final bool Function(T? data)? emptyWhen;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (ctx, snap) {
        final Widget child;
        if (snap.isWaiting) {
          child = loadingBuilder(ctx);
        } else {
          if (snap.hasError) {
            child = errorBuilder(ctx, snap.error);
          } else {
            final isEmpty = emptyWhen?.call(snap.data) ?? false;
            child = isEmpty ? emptyBuilder!(ctx) : builder(ctx, snap.data);
          }
        }

        return Skeletonizer.zone(
          enabled: snap.isWaiting,
          enableSwitchAnimation: true,
          child: child,
        );
      },
    );
  }
}
