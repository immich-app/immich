import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const immichLightBackgroundColor = Color(0xFFf6f8fe);
const immichDarkBackgroundColor = Color.fromARGB(255, 34, 34, 34);

const immichLightLinearGradient = LinearGradient(
  colors: [
    Color.fromARGB(255, 216, 219, 238),
    Color.fromARGB(255, 226, 230, 231)
  ],
  begin: Alignment.centerRight,
  end: Alignment.centerLeft,
);

const immichDarkLinearGradient = LinearGradient(
  colors: [Color.fromARGB(255, 34, 34, 34), Color.fromARGB(255, 34, 34, 34)],
  begin: Alignment.centerRight,
  end: Alignment.centerLeft,
);

ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  primarySwatch: Colors.indigo,
  iconTheme: const IconThemeData(color: Colors.indigo),
  toggleableActiveColor: Colors.grey,
  unselectedWidgetColor: Colors.indigo,
  disabledColor: Colors.grey[200],
  cardColor: Colors.grey[100],
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    unselectedItemColor: Colors.black54,
    selectedItemColor: Colors.indigo,
    selectedLabelStyle: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
    ),
    unselectedLabelStyle: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
    ),
  ),
  scaffoldBackgroundColor: immichLightBackgroundColor,
  appBarTheme: const AppBarTheme(
    backgroundColor: immichLightBackgroundColor,
    foregroundColor: Colors.indigo,
    elevation: 1,
    centerTitle: true,
    systemOverlayStyle: SystemUiOverlayStyle.dark,
  ),
);

ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  primaryColor: Colors.indigoAccent,
  primarySwatch: Colors.indigo,
  iconTheme: const IconThemeData(color: Colors.red),
  toggleableActiveColor: Colors.indigo,
  unselectedWidgetColor: Colors.white70,
  disabledColor: Colors.grey.shade700,
  cardColor: Colors.grey[800],
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans', color: Colors.white),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    unselectedItemColor: Colors.white70,
    selectedItemColor: Colors.indigoAccent,
    selectedLabelStyle: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
    ),
    unselectedLabelStyle: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
    ),
  ),
  // textTheme: const TextTheme(
  //   headline1: TextStyle(color: Colors.white),
  //   headline2: TextStyle(color: Colors.white),
  //   headline3: TextStyle(color: Colors.white),
  //   headline4: TextStyle(color: Colors.white),
  //   headline5: TextStyle(color: Colors.white),
  //   headline6: TextStyle(color: Colors.white),
  //   bodyText1: TextStyle(color: Colors.white),
  //   bodyText2: TextStyle(color: Colors.white),
  //   button: TextStyle(color: Colors.white),
  //   subtitle1: TextStyle(color: Colors.white),
  //   subtitle2: TextStyle(color: Colors.white),
  //   overline: TextStyle(color: Colors.white),
  //   caption: TextStyle(color: Colors.white),
  // ),
  scaffoldBackgroundColor: immichDarkBackgroundColor,
  appBarTheme: const AppBarTheme(
    backgroundColor: immichDarkBackgroundColor,
    foregroundColor: Colors.indigoAccent,
    elevation: 1,
    centerTitle: true,
    systemOverlayStyle: SystemUiOverlayStyle.light,
  ),
);
