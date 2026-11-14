@echo off
setlocal

cd /d "%~dp0"

set "PATH=C:\Program Files\Git\bin;%LOCALAPPDATA%\nasm-bin;C:\Program Files\LLVM\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GIT_CONFIG_COUNT=1"
set "GIT_CONFIG_KEY_0=http.sslbackend"
set "GIT_CONFIG_VALUE_0=schannel"

findstr /c:"gradle-8.14-all.zip" "android\gradle\wrapper\gradle-wrapper.properties" >nul
if errorlevel 1 (
  echo [ERROR] android\gradle\wrapper\gradle-wrapper.properties no apunta a Gradle 8.14.
  echo         Restauralo con: git checkout -- android/gradle/wrapper/gradle-wrapper.properties
  set "EXIT_CODE=1"
  goto :end
)

echo === Compilando APK release ===
call mise exec -- flutter build apk --release
if errorlevel 1 (
  echo.
  echo [ERROR] La compilacion ha fallado.
  echo         Si cambiaste de rama o tocaste Drift/rutas/API, ejecuta antes: mise //mobile:codegen
  set "EXIT_CODE=1"
  goto :end
)

echo.
echo === APK generado ===
echo %~dp0build\app\outputs\flutter-apk\app-release.apk
set "EXIT_CODE=0"

:end
echo %cmdcmdline% | find /i "%~0" >nul && pause
endlocal & exit /b %EXIT_CODE%
