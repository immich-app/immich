import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/repositories/view_handler.repository.dart';
import 'package:immich_mobile/services/view_intent_service.dart';
import 'package:mocktail/mocktail.dart';

class MockViewHandlerRepository extends Mock implements ViewHandlerRepository {}

void main() {
  late MockViewHandlerRepository repository;
  late ViewIntentService service;

  const attachment = ViewIntentAttachment(
    path: '/tmp/file.jpg',
    type: ViewIntentAttachmentType.image,
    localAssetId: '42',
  );

  setUp(() {
    repository = MockViewHandlerRepository();
    service = ViewIntentService(repository);
  });

  test('checkViewIntent does nothing when no attachment', () async {
    when(() => repository.checkViewIntent()).thenAnswer((_) async => null);

    var called = 0;
    service.onViewMedia = (_) async {
      called++;
    };

    await service.checkViewIntent();

    expect(called, 0);
    verify(() => repository.checkViewIntent()).called(1);
  });

  test('checkViewIntent calls handler immediately when handler is set', () async {
    when(() => repository.checkViewIntent()).thenAnswer((_) async => attachment);

    List<ViewIntentAttachment>? received;
    service.onViewMedia = (attachments) async {
      received = attachments;
    };

    await service.checkViewIntent();

    expect(received, isNotNull);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
    verify(() => repository.checkViewIntent()).called(1);
  });

  test('checkViewIntent stores pending attachment when handler is not set', () async {
    when(() => repository.checkViewIntent()).thenAnswer((_) async => attachment);

    await service.checkViewIntent();

    List<ViewIntentAttachment>? received;
    service.onViewMedia = (attachments) async {
      received = attachments;
    };
    await service.flushPending();

    expect(received, isNotNull);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
  });

  test('defer + flushPending does nothing without handler, then flushes once when handler appears', () async {
    service.defer(attachment);

    // No handler yet: should keep pending.
    await service.flushPending();

    var called = 0;
    List<ViewIntentAttachment>? received;
    service.onViewMedia = (attachments) async {
      called++;
      received = attachments;
    };

    await service.flushPending();
    await service.flushPending();

    expect(called, 1);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
  });
}
