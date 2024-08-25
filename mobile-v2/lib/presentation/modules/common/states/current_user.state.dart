import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class CurrentUserCubit extends Cubit<User> {
  CurrentUserCubit(super.initialState);

  void updateUser(User user) => emit(user);
}
