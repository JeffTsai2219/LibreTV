#!/bin/bash

# LibreTV 本地构建 Docker 容器启动脚本
# 此脚本使用本地代码构建 Docker 镜像并运行

echo "========================================"
echo "LibreTV 本地构建脚本"
echo "========================================"
echo

# 检查是否已存在同名容器
if docker ps -a --filter "name=libretv-local" --format "{{.Names}}" | grep -q "libretv-local"; then
    echo "检测到已存在名为 libretv-local 的容器，正在删除..."
    docker rm -f libretv-local
    echo
fi

# 构建本地镜像
echo "正在使用本地代码构建 Docker 镜像..."
docker build -t libretv-local:latest .

if [ $? -ne 0 ]; then
    echo
    echo "========================================"
    echo "错误: 镜像构建失败！"
    echo "========================================"
    read -p "按回车键退出..."
    exit 1
fi

echo
echo "镜像构建成功！"
echo

# 运行容器
echo "正在启动容器..."
docker run -d --name libretv-local -p 8080:8080 -e PASSWORD=123456 libretv-local:latest

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "LibreTV 服务已成功启动！"
    echo "========================================"
    echo
    echo "访问地址: http://localhost:8080"
    echo "密码: 123456"
    echo
    echo "容器名称: libretv-local"
    echo "端口映射: 8080:8080"
    echo "镜像来源: 本地代码构建"
    echo
    echo "使用以下命令管理容器："
    echo "  查看日志: docker logs libretv-local"
    echo "  停止服务: docker stop libretv-local"
    echo "  启动服务: docker start libretv-local"
    echo "  删除容器: docker rm -f libretv-local"
    echo "  删除镜像: docker rmi libretv-local:latest"
    echo "========================================"
else
    echo
    echo "========================================"
    echo "错误: 容器启动失败！"
    echo "========================================"
    echo "请检查 Docker 是否正常运行"
fi

echo
read -p "按回车键退出..."