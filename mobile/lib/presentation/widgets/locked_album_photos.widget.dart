import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/locked_album_session.dart';
import 'package:openapi/api.dart' show ApiException;

/// No viewer route, share action, ImageProvider, disk cache, or global image cache.
class LockedAlbumPhotos extends StatefulWidget {
  const LockedAlbumPhotos({
    super.key,
    required this.session,
    required this.ownerId,
    required this.load,
    required this.thumbnail,
    required this.add,
  });
  final LockedAlbumSession session;
  final String ownerId;
  final Future<List<RemoteAsset>> Function(int offset) load;
  final Future<Uint8List> Function(String id) thumbnail;
  final bool add;

  @override
  State<LockedAlbumPhotos> createState() => _LockedAlbumPhotosState();
}

class _LockedAlbumPhotosState extends State<LockedAlbumPhotos> {
  final _assets = <RemoteAsset>[];
  final _selection = <String>{};
  bool _loading = false;
  bool _more = true;
  String? _error;
  int _offset = 0;
  bool get _active => mounted && widget.session.isReady;

  @override
  void initState() {
    super.initState();
    widget.session.addListener(_changed);
    unawaited(_load());
  }

  void _changed() {
    if (!widget.session.isActive) {
      _assets.clear();
      _selection.clear();
    }
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _load() async {
    if (!_active || _loading) {
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final assets = await widget.load(_offset);
      if (!_active) {
        return;
      }
      _offset += assets.length;
      _more = widget.add && assets.length == 50;
      final known = _assets.map((a) => a.id).toSet();
      _assets.addAll(assets.where((a) => a.ownerId == widget.ownerId && a.isLocked && !a.isTrashed && known.add(a.id)));
    } on ApiException catch (e) {
      if (e.code == 401 || e.code == 403) {
        widget.session.revoke();
      } else if (_active) {
        _error = 'Could not load photos. Try again.';
      }
    } catch (_) {
      if (_active) {
        _error = 'Could not load photos. Try again.';
      }
    } finally {
      if (_active) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  void dispose() {
    widget.session.removeListener(_changed);
    _assets.clear();
    _selection.clear();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.session.isReady) {
      return const SizedBox.shrink();
    }
    final busy = widget.session.busy;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.add ? 'Choose locked photos (up to 100)' : 'Group photos',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const Text('Removing membership keeps photos in your locked folder.'),
        if (_loading) const LinearProgressIndicator(),
        if (_error != null) TextButton(onPressed: _load, child: Text(_error!)),
        if (!_loading && _assets.isEmpty && _error == null)
          Text(widget.add ? 'No synced locked photos available.' : 'No synced photos on this member page.'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 3,
            mainAxisSpacing: 3,
          ),
          itemCount: _assets.length,
          itemBuilder: (context, index) {
            final asset = _assets[index];
            final selected = _selection.contains(asset.id);
            return Semantics(
              label: 'Locked ${asset.isVideo ? 'video' : 'photo'} ${index + 1}',
              selected: selected,
              child: InkWell(
                key: ValueKey('locked-photo-${asset.id}'),
                onTap: busy
                    ? null
                    : () => setState(() {
                        if (selected) {
                          _selection.remove(asset.id);
                        } else if (_selection.length < 100) {
                          _selection.add(asset.id);
                        }
                      }),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    LockedAlbumPreview(
                      key: ValueKey(asset.id),
                      session: widget.session,
                      load: () => widget.thumbnail(asset.id),
                    ),
                    if (asset.isVideo)
                      const Align(
                        alignment: Alignment.bottomLeft,
                        child: Icon(Icons.videocam, color: Colors.white),
                      ),
                    Align(
                      alignment: Alignment.topRight,
                      child: Icon(
                        selected ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: selected ? Theme.of(context).colorScheme.primary : Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        if (_more) TextButton(onPressed: _loading ? null : _load, child: const Text('Load more locked photos')),
        FilledButton(
          onPressed: busy || _selection.isEmpty
              ? null
              : () async {
                  final ids = _selection.toList();
                  await widget.session.changeMembership(ids, add: widget.add);
                  if (_active && widget.session.error == null) {
                    setState(() => _selection.clear());
                  }
                },
          child: Text('${widget.add ? 'Add' : 'Remove'} ${_selection.length} selected'),
        ),
      ],
    );
  }
}

/// Decode directly into a disposable ui.Image, avoiding Flutter's shared cache.
class LockedAlbumPreview extends StatefulWidget {
  const LockedAlbumPreview({super.key, required this.session, required this.load});
  final LockedAlbumSession session;
  final Future<Uint8List> Function() load;
  @override
  State<LockedAlbumPreview> createState() => _LockedAlbumPreviewState();
}

class _LockedAlbumPreviewState extends State<LockedAlbumPreview> {
  ui.Image? _image;
  bool _failed = false;
  bool get _active => mounted && widget.session.isReady;
  @override
  void initState() {
    super.initState();
    widget.session.addListener(_changed);
    unawaited(_load());
  }

  void _changed() {
    if (!widget.session.isActive) {
      _image?.dispose();
      _image = null;
      if (mounted) {
        setState(() {});
      }
    }
  }

  Future<void> _load() async {
    if (!_active) {
      return;
    }
    try {
      final bytes = await widget.load();
      if (!_active) {
        return;
      }
      final codec = await ui.instantiateImageCodec(bytes, targetWidth: 300);
      try {
        if (!_active) {
          return;
        }
        final frame = await codec.getNextFrame();
        if (!_active) {
          frame.image.dispose();
          return;
        }
        setState(() => _image = frame.image);
      } finally {
        codec.dispose();
      }
    } on ApiException catch (e) {
      if (e.code == 401 || e.code == 403) {
        widget.session.revoke();
      }
      if (_active) {
        setState(() => _failed = true);
      }
    } catch (_) {
      if (_active) {
        setState(() => _failed = true);
      }
    }
  }

  @override
  void dispose() {
    widget.session.removeListener(_changed);
    _image?.dispose();
    _image = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => !_active
      ? const SizedBox.shrink()
      : _image != null
      ? RawImage(image: _image, fit: BoxFit.cover)
      : ColoredBox(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Icon(_failed ? Icons.broken_image_outlined : Icons.photo_outlined),
        );
}
