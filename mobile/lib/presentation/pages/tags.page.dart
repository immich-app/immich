import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/tags/private_content_auth.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

@RoutePage()
class TagsPage extends ConsumerWidget {
  const TagsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(privateSessionProvider.notifier);
    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) {
          unawaited(session.lock());
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(context.t.tags),
          actions: [
            const _PrivateSessionButton(),
            IconButton(
              tooltip: context.t.create_tag,
              icon: const Icon(Icons.add),
              onPressed: () => _editTag(context, ref),
            ),
          ],
        ),
        body: ref
            .watch(Store.tags.all())
            .widgetWhen(skipLoadingOnRefresh: false, onData: (tags) => _TagList(tags: tags, parentId: null)),
      ),
    );
  }
}

class _TagList extends StatelessWidget {
  const _TagList({required this.tags, required this.parentId});

  final List<Tag> tags;
  final String? parentId;

  @override
  Widget build(BuildContext context) {
    final children = tags.where((tag) => tag.parentId == parentId).toList();
    return ListView.builder(
      itemCount: children.length,
      itemBuilder: (context, index) {
        final tag = children[index];
        final isPrivate = tags.isEffectivelyPrivate(tag);
        return ListTile(
          leading: Icon(isPrivate ? Icons.lock_outline : Icons.sell_outlined),
          title: Text(tag.value.split('/').last),
          subtitle: isPrivate ? Text(context.t.private_tag) : null,
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.pushRoute(TagAssetsRoute(tagId: tag.id, isPrivate: isPrivate)),
        );
      },
    );
  }
}

@RoutePage()
class TagAssetsPage extends ConsumerWidget {
  const TagAssetsPage({super.key, required this.tagId, required this.isPrivate});

  final String tagId;
  final bool isPrivate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(privateSessionProvider.notifier);
    final isRootOfTagStack =
        context.router.stackData
            .where((route) => route.name == TagsRoute.name || route.name == TagAssetsRoute.name)
            .length ==
        1;
    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop && isRootOfTagStack) {
          unawaited(session.lock());
        }
      },
      child: _TagAssetsView(tagId: tagId, isPrivate: isPrivate),
    );
  }
}

class _TagAssetsView extends HookConsumerWidget {
  const _TagAssetsView({required this.tagId, required this.isPrivate});

  final String tagId;
  final bool isPrivate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cursors = useState(<String?>[null]);
    final busy = useState(false);
    final trashed = useState(false);
    final visible = ref.watch(privateContentVisibleProvider);
    if (isPrivate && !visible) {
      return Scaffold(
        appBar: AppBar(title: Text(context.t.tags), actions: const [_PrivateSessionButton()]),
      );
    }

    final page = ref.watch(Store.tags.assets((id: tagId, cursor: cursors.value.last, trashed: trashed.value)));
    return ref
        .watch(Store.tags.all())
        .widgetWhen(
          skipLoadingOnRefresh: false,
          onData: (tags) {
            final tag = tags.where((tag) => tag.id == tagId).firstOrNull;
            if (tag == null) {
              return Scaffold(
                appBar: AppBar(title: Text(context.t.tags), actions: const [_PrivateSessionButton()]),
              );
            }

            final privateTag = tags.isEffectivelyPrivate(tag);
            final parents = tags.where((candidate) => candidate.id == tag.parentId);
            final privateParent = parents.any(tags.isEffectivelyPrivate);
            final appBar = SliverAppBar(
              pinned: true,
              title: Text(tag.value),
              actions: [
                if (privateTag) const _PrivateSessionButton(),
                if (privateTag)
                  IconButton(
                    tooltip: trashed.value ? context.t.photos : context.t.trash,
                    icon: Icon(trashed.value ? Icons.photo_library_outlined : Icons.delete_outline),
                    onPressed: () {
                      cursors.value = [null];
                      trashed.value = !trashed.value;
                    },
                  ),
                if (!trashed.value)
                  IconButton(
                    tooltip: context.t.add_assets,
                    onPressed: busy.value
                        ? null
                        : () async {
                            busy.value = true;
                            try {
                              await _addAssets(context, ref, tag, isPrivate: privateTag);
                              if (context.mounted) {
                                cursors.value = [null];
                              }
                            } finally {
                              if (context.mounted) {
                                busy.value = false;
                              }
                            }
                          },
                    icon: const Icon(Icons.add_photo_alternate_outlined),
                  ),
                PopupMenuButton<_TagCommand>(
                  onSelected: (command) => switch (command) {
                    _TagCommand.add => _editTag(context, ref, parentId: tag.id, privateParent: privateTag),
                    _TagCommand.edit => _editTag(context, ref, tag: tag, privateParent: privateParent),
                    _TagCommand.delete => _deleteTag(context, ref, tag, isPrivate: privateTag),
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: _TagCommand.add, child: Text(context.t.create_tag)),
                    PopupMenuItem(value: _TagCommand.edit, child: Text(context.t.edit_tag)),
                    PopupMenuItem(value: _TagCommand.delete, child: Text(context.t.delete)),
                  ],
                ),
              ],
            );
            return page.widgetWhen(
              skipLoadingOnRefresh: false,
              onData: (page) => ProviderScope(
                key: ObjectKey(page.assets),
                overrides: [
                  timelineServiceProvider.overrideWith((ref) {
                    final service = ref
                        .watch(timelineFactoryProvider)
                        .fromAssetsWithBuckets(
                          page.assets,
                          privateTag ? TimelineOrigin.privateTag : TimelineOrigin.search,
                        );
                    ref.onDispose(service.dispose);
                    return service;
                  }),
                ],
                child: Timeline(
                  appBar: appBar,
                  topSliverWidget: SliverToBoxAdapter(
                    child: Column(
                      children: [
                        if (!trashed.value)
                          for (final child in tags.where((candidate) => candidate.parentId == tag.id))
                            ListTile(
                              leading: Icon(
                                tags.isEffectivelyPrivate(child) ? Icons.lock_outline : Icons.sell_outlined,
                              ),
                              title: Text(child.value.split('/').last),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.pushRoute(
                                TagAssetsRoute(tagId: child.id, isPrivate: tags.isEffectivelyPrivate(child)),
                              ),
                            ),
                      ],
                    ),
                  ),
                  bottomSliverWidget: SliverToBoxAdapter(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (cursors.value.length > 1)
                          IconButton(
                            tooltip: MaterialLocalizations.of(context).previousPageTooltip,
                            onPressed: () => cursors.value = cursors.value.sublist(0, cursors.value.length - 1),
                            icon: const Icon(Icons.chevron_left),
                          ),
                        if (page.nextCursor != null)
                          TextButton(
                            onPressed: () => cursors.value = [...cursors.value, page.nextCursor],
                            child: Text(context.t.load_more),
                          ),
                      ],
                    ),
                  ),
                  bottomSheet: BaseBottomSheet(
                    initialChildSize: 0.25,
                    maxChildSize: 0.4,
                    shouldCloseOnMinExtent: false,
                    actions: [
                      if (trashed.value)
                        const ActionColumnButton(action: RestoreAction(source: .timeline))
                      else ...[
                        const ActionColumnButton(action: DownloadAction(source: .timeline)),
                        const ActionColumnButton(action: DeleteAction(source: .timeline)),
                        ActionColumnButton(
                          action: UntagAction(source: .timeline, tagId: tag.id, isPrivate: privateTag),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        );
  }
}

enum _TagCommand { add, edit, delete }

class _PrivateSessionButton extends ConsumerWidget {
  const _PrivateSessionButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unlocked = ref.watch(privateSessionProvider);
    return IconButton(
      tooltip: unlocked ? context.t.lock : context.t.unlock_private_content,
      icon: Icon(unlocked ? Icons.lock_open_outlined : Icons.lock_outline),
      onPressed: () async {
        try {
          if (unlocked) {
            await ref.read(privateSessionProvider.notifier).lock();
          } else {
            await unlockPrivateContent(context, ref);
          }
        } catch (error, stack) {
          handleError(error, stack: stack);
        }
      },
    );
  }
}

Future<void> _editTag(
  BuildContext context,
  WidgetRef ref, {
  Tag? tag,
  String? parentId,
  bool privateParent = false,
}) async {
  final result = await showDialog<({String name, bool isPrivate})>(
    context: context,
    builder: (context) => _TagEditor(tag: tag, privateParent: privateParent),
  );
  if (result == null || !context.mounted) {
    return;
  }

  try {
    if ((result.isPrivate || tag?.isPrivate == true) && !await unlockPrivateContent(context, ref)) {
      return;
    }
    if (!context.mounted) {
      return;
    }
    final store = ref.read(Store.tags);
    if (tag == null) {
      await store.create(result.name, isPrivate: !privateParent && result.isPrivate, parentId: parentId);
    } else {
      final changed = !privateParent && result.isPrivate != tag.isPrivate;
      await store.update(tag, name: result.name, isPrivate: changed ? result.isPrivate : null);
    }
  } catch (error, stack) {
    handleError(error, stack: stack);
  }
}

class _TagEditor extends HookConsumerWidget {
  const _TagEditor({required this.tag, required this.privateParent});

  final Tag? tag;
  final bool privateParent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = useTextEditingController(text: tag?.value.split('/').last);
    final isPrivate = useState(privateParent || tag?.isPrivate == true);
    final text = useListenable(name).text.trim();
    if ((privateParent || tag?.isPrivate == true) && !ref.watch(privateContentVisibleProvider)) {
      return const SizedBox.shrink();
    }
    return AlertDialog(
      title: Text(tag == null ? context.t.create_tag : context.t.edit_tag),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: name,
            autofocus: true,
            decoration: InputDecoration(labelText: context.t.tag_name),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(context.t.private_tag),
            subtitle: Text(context.t.private_tag_description),
            value: isPrivate.value,
            onChanged: privateParent ? null : (value) => isPrivate.value = value,
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(context.t.cancel)),
        TextButton(
          onPressed: text.isEmpty || text.contains('/')
              ? null
              : () => Navigator.pop(context, (name: text, isPrivate: isPrivate.value)),
          child: Text(context.t.save),
        ),
      ],
    );
  }
}

Future<void> _deleteTag(BuildContext context, WidgetRef ref, Tag tag, {required bool isPrivate}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => Consumer(
      builder: (context, ref, _) => isPrivate && !ref.watch(privateContentVisibleProvider)
          ? const SizedBox.shrink()
          : ConfirmDialog(
              title: context.t.delete,
              content: context.t.delete_tag_confirmation_prompt(tagName: tag.value),
              ok: context.t.delete,
            ),
    ),
  );
  if (confirmed != true || !context.mounted || (isPrivate && !ref.read(privateSessionProvider))) {
    return;
  }
  try {
    await ref.read(Store.tags).delete(tag);
    if (context.mounted) {
      await context.router.maybePop();
    }
  } catch (error, stack) {
    handleError(error, stack: stack);
  }
}

Future<void> _addAssets(BuildContext context, WidgetRef ref, Tag tag, {required bool isPrivate}) async {
  final assets = await context.pushRoute<Set<BaseAsset>>(AssetSelectionTimelineRoute());
  if (assets == null || assets.isEmpty || !context.mounted || (isPrivate && !ref.read(privateSessionProvider))) {
    return;
  }

  final store = ref.read(Store.tags);
  final cancel = Completer<void>();
  final subscription = ref.listenManual(privateSessionProvider, (_, unlocked) {
    if (isPrivate && !unlocked && !cancel.isCompleted) {
      cancel.complete();
    }
  });

  try {
    final remoteIds = assets.whereType<RemoteAsset>().map((asset) => asset.id).toList();
    var added = await store.addAssets(tag, remoteIds, isPrivate: isPrivate);
    final local = assets.whereType<LocalAsset>().toList();
    if (isPrivate && local.isNotEmpty && !cancel.isCompleted && context.mounted) {
      await ref
          .read(foregroundUploadServiceProvider)
          .uploadManual(
            local,
            privateTagId: tag.id,
            cancelToken: cancel,
            callbacks: UploadCallbacks(onSuccess: (_, _) => added++),
          );
      store.refresh(sync: true);
    }
    if (context.mounted && !cancel.isCompleted) {
      final toast = ref.read(toastServiceProvider);
      if (added < assets.length) {
        toast.error(context.t.scaffold_body_error_occurred);
      } else {
        toast.success(context.t.tagged_assets(count: added));
      }
    }
  } catch (error, stack) {
    handleError(error, stack: stack);
  } finally {
    subscription.close();
  }
}
