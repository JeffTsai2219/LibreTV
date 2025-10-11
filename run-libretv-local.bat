@echo off
REM LibreTV ���ش��� Docker �����������ű�
REM �˽ű�ʹ�ñ��ش��빹�� Docker ��������

echo ========================================
echo LibreTV ���ع����ű�
echo ========================================
echo.

REM ����Ƿ��Ѵ���ͬ������
docker ps -a --filter "name=libretv-local" --format "{{.Names}}" | findstr /C:"libretv-local" >nul
if %errorlevel% equ 0 (
    echo ��⵽�Ѵ�����Ϊ libretv-local ������������ɾ��...
    docker rm -f libretv-local
    echo.
)

REM �������ؾ���
echo ����ʹ�ñ��ش��빹�� Docker ����...
docker build -t libretv-local:latest .

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ����: ���񹹽�ʧ�ܣ�
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ���񹹽��ɹ���
echo.

REM ��������
echo ������������...
docker run -d --name libretv-local -p 8080:8080 -e PASSWORD=123456 libretv-local:latest

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo LibreTV �����ѳɹ�������
    echo ========================================
    echo.
    echo ���ʵ�ַ: http://localhost:8080
    echo ����: 123456
    echo.
    echo ��������: libretv-local
    echo �˿�ӳ��: 8080:8080
    echo ������Դ: ���ش��빹��
    echo.
    echo ʹ�����������������:
    echo   �鿴��־: docker logs libretv-local
    echo   ֹͣ����: docker stop libretv-local
    echo   ��������: docker start libretv-local
    echo   ɾ������: docker rm -f libretv-local
    echo   ɾ������: docker rmi libretv-local:latest
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
