import 'package:immich_data/server/errors.dart';

abstract class ApiRepository {
  const ApiRepository();

  Future<T> checkNull<T>(Future<T?> future) async {
    final response = await future;
    if (response == null) {
      throw const NoResponseDtoError();
    }
    return response;
  }
}
