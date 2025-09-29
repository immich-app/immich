enum BackupSelection {
  // Used to sort albums based on the backupSelection
  // selected -> none -> excluded
  // Do not change the order of these values
  selected,
  none,
  excluded,
}

class LocalAlbum {
  final String id;
  final String name;
  final DateTime updatedAt;
  final bool isIosSharedAlbum;

  final int assetCount;
  final BackupSelection backupSelection;
  final String? linkedRemoteAlbumId;

  const LocalAlbum({
    required this.id,
    required this.name,
    required this.updatedAt,
    this.assetCount = 0,
    this.backupSelection = BackupSelection.none,
    this.isIosSharedAlbum = false,
    this.linkedRemoteAlbumId,
  });

  LocalAlbum copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
    String? linkedRemoteAlbumId,
  }) {
    return LocalAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      assetCount: assetCount ?? this.assetCount,
      backupSelection: backupSelection ?? this.backupSelection,
      isIosSharedAlbum: isIosSharedAlbum ?? this.isIosSharedAlbum,
      linkedRemoteAlbumId: linkedRemoteAlbumId ?? this.linkedRemoteAlbumId,
    );
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalAlbum) return false;
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.updatedAt == updatedAt &&
        other.assetCount == assetCount &&
        other.backupSelection == backupSelection &&
        other.isIosSharedAlbum == isIosSharedAlbum &&
        other.linkedRemoteAlbumId == linkedRemoteAlbumId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode ^
        backupSelection.hashCode ^
        isIosSharedAlbum.hashCode ^
        linkedRemoteAlbumId.hashCode;
  }

  @override
  String toString() {
    return '''LocalAlbum: {
id: $id,
name: $name,
updatedAt: $updatedAt,
assetCount: $assetCount,
backupSelection: $backupSelection,
isIosSharedAlbum: $isIosSharedAlbum
linkedRemoteAlbumId: $linkedRemoteAlbumId,
}''';
  }
}

int square(int num) {
  return num * num;
}

@pragma('vm:never-inline')
List<LocalAlbum> getAlbums() {
    final updatedAt = DateTime.now();
    final selection = BackupSelection.values;
    return List.generate(100000, (i) {
        return LocalAlbum(id: i.toString(), name: '', updatedAt: updatedAt, backupSelection: selection[i % 3]);
    });
}

@pragma('vm:never-inline')
List<LocalAlbum> setAlbum1(List<LocalAlbum> albums, LocalAlbum album) {
    final newAlbums = List.filled(albums.length, LocalAlbum(id: '', name: '', updatedAt: DateTime.now()));
    newAlbums.setAll(0, albums);
    for (int i = 0; i < newAlbums.length; i++) {
      final currentAlbum = newAlbums[i];
      if (currentAlbum.id == album.id) {
        newAlbums[i] = currentAlbum.copyWith(backupSelection: BackupSelection.selected);
        break;
      }
    }
    return newAlbums;
}

@pragma('vm:never-inline')
List<LocalAlbum> setAlbum2(List<LocalAlbum> albums, LocalAlbum album) {
    final newAlbums = List.filled(albums.length, LocalAlbum(id: '', name: '', updatedAt: DateTime.now()));
    for (int i = 0; i < newAlbums.length; i++) {
      final currentAlbum = newAlbums[i];
      newAlbums[i] = currentAlbum.id == album.id ? currentAlbum.copyWith(backupSelection: BackupSelection.selected) : currentAlbum;
    }
    return newAlbums;
}

@pragma('vm:never-inline')
List<LocalAlbum> setAlbum3(List<LocalAlbum> albums, LocalAlbum album) {
    final newAlbums = albums.toList(growable: false);
    for (int i = 0; i < newAlbums.length; i++) {
      final currentAlbum = newAlbums[i];
      if (currentAlbum.id == album.id) {
        newAlbums[i] = currentAlbum.copyWith(backupSelection: BackupSelection.selected);
        break;
      }
    }
    return newAlbums;
}

@pragma('vm:never-inline')
Set<String> toSet1(List<LocalAlbum> albums) {
    return albums.map((album) => album.id).toSet();
}

@pragma('vm:never-inline')
Set<String> toSet2(List<LocalAlbum> albums) {
    final ids = <String>{};
    for (final album in albums) {
        ids.add(album.id);
    }
    return ids;
}

@pragma('vm:never-inline')
Set<String> toSet3(List<LocalAlbum> albums) {
    return Set.unmodifiable(albums.map((album) => album.id));
}

@pragma('vm:never-inline')
Set<String> toSet4(List<LocalAlbum> albums) {
    final ids = <String>{};
    for (int i = 0; i < albums.length; i++) {
        final id = albums[i].id;
        ids.add(id);
    }
    return ids;
}

@pragma('vm:never-inline')
List<LocalAlbum> toFiltered1(List<LocalAlbum> albums, BackupSelection selection) {
    return albums.where((album) => album.backupSelection == selection).toList(growable: false);
}

@pragma('vm:never-inline')
List<LocalAlbum> toFiltered2(List<LocalAlbum> albums, BackupSelection selection) {
    final filtered = <LocalAlbum>[];
    for (final album in albums) {
        if (album.backupSelection == selection) {
            filtered.add(album);
        }
    }
    return filtered;
}

@pragma('vm:never-inline')
List<LocalAlbum> toFiltered3(List<LocalAlbum> albums, BackupSelection selection) {
    final filtered = <LocalAlbum>[];
    for (int i = 0; i < albums.length; i++) {
        final album = albums[i];
        if (album.backupSelection == selection) {
            filtered.add(album);
        }
    }
    return filtered;
}

late Set<String> ids;
late List<LocalAlbum> localAlbums;
void main(List<String> args) {
    final albums = getAlbums();
    // final album = LocalAlbum(id: '50000', name: '', updatedAt: DateTime.now());
    final stopwatch = Stopwatch()..start();
    // localAlbums = setAlbum3(albums, album);
    // ids = toSet1(albums);
    localAlbums = toFiltered2(albums, BackupSelection.selected);
    stopwatch.stop();
    print('Elapsed time: ${(stopwatch.elapsedMicroseconds / 1000).toStringAsFixed(2)}ms');
}
