import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/device_permission.service.dart';
import 'package:mocktail/mocktail.dart';

import '../mocks.dart';

void main() {
  late RepositoryMocks mocks;
  late DevicePermissionService sut;

  void stubPermissions(Map<DevicePermission, DevicePermissionStatus> statuses) {
    DevicePermissionStatus answer(Invocation i) => statuses[i.positionalArguments.first] ?? .denied;
    when(mocks.permission.getStatus).thenAnswer((i) async => answer(i));
    when(mocks.permission.request).thenAnswer((i) async => answer(i));
  }

  setUp(() {
    debugDefaultTargetPlatformOverride = .android;
    mocks = .new();
    sut = .new(mocks.permission.repo);
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  group('DevicePermissionService', () {
    group('Gallery', () {
      test('is denied when media location is missing but photos and videos are granted', () async {
        when(mocks.permission.getAndroidSdkVersion).thenAnswer((_) async => 34);
        stubPermissions({.photos: .granted, .videos: .granted, .mediaLocation: .denied});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);
        verify(() => mocks.permission.repo.getStatus(DevicePermission.mediaLocation)).called(1);
      });

      test('is granted when media location is granted', () async {
        when(mocks.permission.getAndroidSdkVersion).thenAnswer((_) async => 34);
        stubPermissions({.photos: .granted, .videos: .granted, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.granted);
        verify(() => mocks.permission.repo.getStatus(DevicePermission.mediaLocation)).called(1);
      });

      test('checks media location on the legacy storage path', () async {
        when(mocks.permission.getAndroidSdkVersion).thenAnswer((_) async => 30);
        stubPermissions({.storage: .granted, .mediaLocation: .denied});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);
        verify(() => mocks.permission.repo.getStatus(DevicePermission.mediaLocation)).called(1);
      });

      test('ignores media location below SDK 29', () async {
        when(mocks.permission.getAndroidSdkVersion).thenAnswer((_) async => 28);
        stubPermissions({.storage: .granted, .mediaLocation: .denied});
        expect(await sut.galleryStatus(), DevicePermissionStatus.granted);
        verifyNever(() => mocks.permission.repo.getStatus(.mediaLocation));
      });

      test('ignores media location on iOS', () async {
        debugDefaultTargetPlatformOverride = .iOS;
        stubPermissions({.photos: .granted, .mediaLocation: .denied});
        expect(await sut.galleryStatus(), DevicePermissionStatus.granted);
        verifyNever(() => mocks.permission.repo.getStatus(.mediaLocation));
      });

      test('is limited when only one of photos and videos is limited', () async {
        stubPermissions({.photos: .granted, .videos: .limited, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.limited);

        stubPermissions({.photos: .limited, .videos: .granted, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.limited);

        stubPermissions({.photos: .limited, .videos: .limited, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.limited);
      });

      test('is denied when only one of photos and videos is denied', () async {
        stubPermissions({.photos: .granted, .videos: .denied, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);

        stubPermissions({.photos: .denied, .videos: .granted, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);

        stubPermissions({.photos: .limited, .videos: .denied, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);
      });

      test('is permanently denied when only one of photos and videos is permanently denied', () async {
        stubPermissions({.photos: .granted, .videos: .permanentlyDenied, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.permanentlyDenied);

        stubPermissions({.photos: .permanentlyDenied, .videos: .denied, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.permanentlyDenied);

        stubPermissions({.photos: .permanentlyDenied, .videos: .granted, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.permanentlyDenied);
      });

      test('checks media location when access is only partial', () async {
        stubPermissions({.photos: .limited, .videos: .limited, .mediaLocation: .denied});
        expect(await sut.galleryStatus(), DevicePermissionStatus.denied);
        verify(() => mocks.permission.repo.getStatus(DevicePermission.mediaLocation)).called(1);
      });

      test('stays limited when media location is granted, but photos or video is limited', () async {
        stubPermissions({.photos: .granted, .videos: .limited, .mediaLocation: .granted});
        expect(await sut.galleryStatus(), DevicePermissionStatus.limited);
      });
    });

    test('does not ask for videos when photos was refused', () async {
      stubPermissions({.photos: .permanentlyDenied});

      expect(await sut.requestGallery(), DevicePermissionStatus.permanentlyDenied);
      verifyNever(() => mocks.permission.repo.request(.videos));
    });
  });
}
