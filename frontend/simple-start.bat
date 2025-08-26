@echo off
echo.
echo 🚀 启动增强版FHEVM前端
echo ====================
echo.

REM 获取可用端口
for /f %%i in ('node scripts/find-port.js') do set AVAILABLE_PORT=%%i

echo ✅ 使用端口: %AVAILABLE_PORT%
echo 🌐 地址: http://localhost:%AVAILABLE_PORT%
echo.

REM 设置环境
set PORT=%AVAILABLE_PORT%
set SKIP_PREFLIGHT_CHECK=true
set DANGEROUSLY_DISABLE_HOST_CHECK=true

REM 启动浏览器
start "" "http://localhost:%AVAILABLE_PORT%"

REM 启动服务器
npm start