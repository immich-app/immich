version="3.1.0+1"
github="https://github.com/isar/isar/releases/download/$version/"


case "$(uname -sr)" in
   Darwin*) # macOS
     curl "${github}/libisar_macos.dylib" -o .dart_tool/libisar_macos.dylib --create-dirs -L
     ;;

   Linux*Microsoft* | Linux*) # WSL or Linux
     curl "${github}/libisar_linux_x64.so" -o .dart_tool/libisar_linux_x64.so --create-dirs -L
     ;;

   CYGWIN*|MINGW*|MINGW32*|MSYS*) # Windows
     curl "${github}/isar_windows_x64.dll" -o .dart_tool/isar_windows_x64.dll --create-dirs -L
     ;;
esac

