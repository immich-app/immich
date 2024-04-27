import 'package:bloc/bloc.dart';

part 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  HomeCubit() : super(HomeState(albumCount: 0));

  void increaseAlbumCount() {
    emit(state.copyWith(albumCount: state.albumCount + 1));
  }

  void decreaseAlbumCount() {
    emit(state.copyWith(albumCount: state.albumCount - 1));
  }
}
