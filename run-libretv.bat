@echo off
REM LibreTV Docker 启动脚本
REM 此脚本用于启动 LibreTV Docker 容器

echo 正在启动 LibreTV Docker 容器...
echo.

REM 检查是否已存在同名容器
docker ps -a --filter "name=libretv" --format "{{.Names}}" | findstr /C:"libretv" >nul
if %errorlevel% equ 0 (
    echo 检测到已存在名为 libretv 的容器，正在删除...
    docker rm -f libretv
    echo.
)

REM 启动容器
docker run -d --name libretv -p 8080:8080 -e PASSWORD=123456 bestzwei/libretv:latest

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo LibreTV 容器已成功启动！
    echo ========================================
    echo.
    echo 访问地址: http://localhost:8080
    echo 密码: 123456
    echo.
    echo 容器名称: libretv
    echo 端口映射: 8080:80
    echo.
    echo 使用以下命令管理容器:
    echo   查看日志: docker logs libretv
    echo   停止容器: docker stop libretv
    echo   启动容器: docker start libretv
    echo   删除容器: docker rm -f libretv
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 错误: 容器启动失败！
    echo ========================================
    echo 请检查 Docker 是否正在运行
)

echo.
pause
