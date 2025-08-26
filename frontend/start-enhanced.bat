@echo off
title Enhanced FHEVM DApp5 - Random Port
color 0a

echo.
echo 🚀 增强版FHEVM DApp5 启动器
echo ===========================
echo.

REM 查找可用端口
echo 🔍 正在查找可用端口...
for /f %%i in ('node scripts/find-port.js') do (
    set FOUND_PORT=%%i
    echo ✅ 找到可用端口: %%i
    goto :found_port
)

:found_port
echo.
echo 🌐 前端将在以下地址启动:
echo    http://localhost:%FOUND_PORT%
echo.
echo 🎯 增强功能:
echo    ✅ 官方Zama CDN SDK v0.1.2
echo    ✅ SDK验证系统
echo    ✅ Sepolia网络支持 (11155111)
echo    ✅ PublicKey缓存 (24小时TTL)
echo    ✅ createFhevmInstance配置
echo.
echo 🔧 按 Ctrl+C 停止服务器
echo.

REM 设置环境变量
set PORT=%FOUND_PORT%
set SKIP_PREFLIGHT_CHECK=true
set DANGEROUSLY_DISABLE_HOST_CHECK=true
set GENERATE_SOURCEMAP=false
set ESLINT_NO_DEV_ERRORS=true
set BROWSER=none

REM 自动打开浏览器
start "" "http://localhost:%FOUND_PORT%"
echo 🌐 正在打开浏览器...
echo.

REM 启动开发服务器
echo 🚀 启动增强版FHEVM服务器...
npx react-scripts start

pause