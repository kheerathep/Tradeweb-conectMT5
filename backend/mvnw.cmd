@echo off
setlocal
if not defined JAVA_HOME (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
    )
)
if not exist "D:\tradeweb\.tmp" (
    mkdir "D:\tradeweb\.tmp"
)
set "MAVEN_OPTS=-Djava.io.tmpdir=D:/tradeweb/.tmp %MAVEN_OPTS%"
call "%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%
