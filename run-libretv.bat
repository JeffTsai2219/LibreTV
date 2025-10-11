@echo off
REM LibreTV Docker �����ű�
REM �˽ű��������� LibreTV Docker ����

echo �������� LibreTV Docker ����...
echo.

REM ����Ƿ��Ѵ���ͬ������
docker ps -a --filter "name=libretv" --format "{{.Names}}" | findstr /C:"libretv" >nul
if %errorlevel% equ 0 (
    echo ��⵽�Ѵ�����Ϊ libretv ������������ɾ��...
    docker rm -f libretv
    echo.
)

REM ��������
docker run -d --name libretv -p 8080:8080 -e PASSWORD=123456 bestzwei/libretv:latest

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo LibreTV �����ѳɹ�������
    echo ========================================
    echo.
    echo ���ʵ�ַ: http://localhost:8080
    echo ����: 123456
    echo.
    echo ��������: libretv
    echo �˿�ӳ��: 8080:80
    echo.
    echo ʹ�����������������:
    echo   �鿴��־: docker logs libretv
    echo   ֹͣ����: docker stop libretv
    echo   ��������: docker start libretv
    echo   ɾ������: docker rm -f libretv
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ����: ��������ʧ�ܣ�
    echo ========================================
    echo ���� Docker �Ƿ���������
)

echo.
pause
