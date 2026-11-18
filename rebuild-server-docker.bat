@echo off
setlocal EnableExtensions

set "DOCKER_DIR=D:\_DESARROLLO\PROJECTS\JB_FOTOS\docker"
set "SERVICE=immich-server"
set "DEV_CONTAINER=jbfotos-immich_server_dev"

set "BUILD=1"
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--no-build" set "BUILD=0" & shift & goto :parse_args
if /i "%~1"=="-n" set "BUILD=0" & shift & goto :parse_args
if /i "%~1"=="--build" set "BUILD=1" & shift & goto :parse_args
if /i "%~1"=="-h" goto :usage
if /i "%~1"=="--help" goto :usage
echo Parametro desconocido: %~1
goto :usage

:args_done
cd /d "%DOCKER_DIR%"

echo [1/3] Eliminando %DEV_CONTAINER% ^(pruebas, puerto 2255^) si estaba en marcha...
docker rm -f %DEV_CONTAINER% >nul 2>&1

if "%BUILD%"=="1" (
  echo [2/3] Compilando imagen de %SERVICE%...
  docker compose build %SERVICE%
  if errorlevel 1 goto :error
) else (
  echo [2/3] Compilacion omitida ^(--no-build^)
)

echo [3/3] Levantando %SERVICE% en http://localhost:2283 ...
docker compose up -d --no-deps %SERVICE%
if errorlevel 1 goto :error_up

echo.
docker compose ps
echo.
echo Hecho. Logs: docker compose -f "%DOCKER_DIR%\docker-compose.yml" logs -f %SERVICE%
exit /b 0

:usage
echo.
echo Uso: %~nx0 [--no-build ^| -n]
echo.
echo   (sin parametros)  Recompila la imagen de %SERVICE% y levanta el contenedor.
echo   --no-build, -n    No recompila; levanta el contenedor con la imagen actual.
exit /b 1

:error
echo.
echo [ERROR] Fallo la compilacion. El contenedor en marcha no se ha tocado.
exit /b 1

:error_up
echo.
echo [ERROR] Fallo al levantar %SERVICE%. Revisa los mensajes de arriba.
exit /b 1
