import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/locked_album.model.dart';
import 'package:immich_mobile/repositories/locked_album_api.repository.dart';
import 'package:openapi/api.dart';

/// One page's in-memory state. Revocation is irreversible; late futures cannot
/// repopulate it. There is deliberately no global provider or persisted cache.
class LockedAlbumSession extends ChangeNotifier {
  LockedAlbumSession(this._repository, {required this.onRevoked, DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final LockedAlbumRepository _repository;
  final VoidCallback onRevoked;
  final DateTime Function() _now;
  List<LockedAlbum> albums = const [];
  List<String> assetIds = const [];
  LockedAlbum? selected;
  bool hasNextPage = false;
  bool busy = false;
  String? error;
  bool _active = true;
  Future<void>? _initialization;
  DateTime? _deadline;
  Timer? _deadlineTimer;
  int _generation = 0;

  bool get isActive => _active;
  bool get isReady => _active && _deadline != null && _now().isBefore(_deadline!);
  DateTime? get deadline => _deadline;

  /// Media requests share the same fail-closed lifetime as metadata requests.
  void revoke() => _revoke();

  void clear() {
    _active = false;
    _generation++;
    _deadlineTimer?.cancel();
    _deadlineTimer = null;
    _deadline = null;
    albums = const [];
    assetIds = const [];
    selected = null;
    hasNextPage = false;
    busy = false;
    error = null;
  }

  void _revoke() {
    if (!_active) {
      return;
    }
    clear();
    notifyListeners();
    onRevoked();
  }

  /// Exactly one status request per page session. Polling /auth/status would
  /// itself extend server elevation. User activity must not renew this timer.
  Future<void> initialize() => _initialization ??= _initialize();

  Future<void> _initialize() async {
    if (!_active) {
      return;
    }
    try {
      final access = await _repository.getAccess().timeout(const Duration(seconds: 4));
      if (!_active) {
        return;
      }
      final remaining = access.deadline.difference(_now());
      if (!access.isElevated || remaining <= Duration.zero) {
        _revoke();
        return;
      }
      _deadline = access.deadline;
      // A one-shot duration also prevents a backward wall-clock adjustment
      // from extending the captured lifetime. No network calls in this timer.
      _deadlineTimer = Timer(remaining, _revoke);
      notifyListeners();
    } catch (_) {
      _revoke();
    }
  }

  bool _withinDeadline() {
    if (!_active || _deadline == null) {
      return false;
    }
    if (!_now().isBefore(_deadline!)) {
      _revoke();
      return false;
    }
    return true;
  }

  Future<void> _run(Future<void> Function(bool Function() current) action) async {
    if (!_active || busy) {
      return;
    }
    final generation = _generation;
    bool current() => _active && generation == _generation && _withinDeadline();
    busy = true;
    error = null;
    notifyListeners();
    try {
      await initialize();
      if (!current()) {
        return;
      }
      await action(current);
    } on ApiException catch (e) {
      if (current()) {
        if (e.code == 401 || e.code == 403) {
          _revoke();
        } else {
          error = 'Could not update private groups. Try again.';
        }
      }
    } on ArgumentError {
      if (current()) {
        error = 'Use a name of 1–255 characters or choose 1–100 photos.';
      }
    } catch (_) {
      if (current()) {
        error = 'Could not load private groups. Try again.';
      }
    } finally {
      if (current()) {
        busy = false;
        notifyListeners();
      }
    }
  }

  Future<void> refresh() => _run((current) async {
    final result = await _repository.getAll();
    if (current()) {
      albums = List.unmodifiable(result);
      final selectedId = selected?.id;
      if (selectedId != null) {
        selected = albums.where((album) => album.id == selectedId).firstOrNull;
        if (selected == null) {
          assetIds = const [];
          hasNextPage = false;
        }
      }
    }
  });

  Future<void> saveName(String name, {String? id}) => _run((current) async {
    final result = id == null ? await _repository.create(name) : await _repository.rename(id, name);
    if (current()) {
      albums = List.unmodifiable([...albums.where((album) => album.id != result.id), result]);
      if (id == null || selected?.id == result.id) {
        selected = result;
        if (id == null) {
          assetIds = const [];
          hasNextPage = false;
        }
      }
    }
  });

  Future<void> deleteSelected() => _run((current) async {
    final id = selected?.id;
    if (id == null) {
      return;
    }
    await _repository.delete(id);
    if (current()) {
      albums = List.unmodifiable(albums.where((album) => album.id != id));
      selected = null;
      assetIds = const [];
      hasNextPage = false;
    }
  });

  Future<void> select(LockedAlbum album) => _run((current) async {
    selected = album;
    assetIds = const [];
    hasNextPage = false;
    final page = await _repository.getAssets(album.id);
    if (current()) {
      assetIds = page.assetIds;
      hasNextPage = page.hasNextPage;
    }
  });

  Future<void> loadMore() => _run((current) async {
    final album = selected;
    if (album == null || !hasNextPage) {
      return;
    }
    final page = await _repository.getAssets(album.id, skip: assetIds.length);
    if (current()) {
      assetIds = List.unmodifiable([...assetIds, ...page.assetIds]);
      hasNextPage = page.hasNextPage;
    }
  });

  Future<void> changeMembership(List<String> ids, {required bool add}) => _run((current) async {
    final album = selected;
    if (album == null) {
      return;
    }
    if (add) {
      await _repository.addAssets(album.id, ids);
    } else {
      await _repository.removeAssets(album.id, ids);
    }
    if (!current()) {
      return;
    }
    // Discard the old page after mutation; offset pagination isn't a snapshot.
    assetIds = const [];
    hasNextPage = false;
    final page = await _repository.getAssets(album.id);
    if (!current()) {
      return;
    }
    assetIds = page.assetIds;
    hasNextPage = page.hasNextPage;
    final result = await _repository.getAll();
    if (current()) {
      albums = List.unmodifiable(result);
      selected = albums.where((item) => item.id == album.id).firstOrNull;
    }
  });

  @override
  void dispose() {
    clear();
    super.dispose();
  }
}
