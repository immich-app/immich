import 'package:immich_mobile/constants/enums.dart';

extension OppositeSortOrder on SortOrder {
  SortOrder get opposite => this == SortOrder.asc ? SortOrder.desc : SortOrder.asc;
}
