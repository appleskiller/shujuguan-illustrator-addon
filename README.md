# shujuguan-illustrator-addon
illustrator-addon

### Development & Debug

#### 开启Adobe开发模式
* Windows
1. 运行 regedit
2. 为HKEY_CURRENT_USER\Software\Adobe\CSXS.7注册表项添加"字符串"值项PlayerDebugMode=1。
* OS X
1. 打开终端
2. 输入
```
$ defaults write com.adobe.CSXS.7 PlayerDebugMode 1
```

其他CC版本对应如下：
* CC 、CC 2014：CSXS.5
* CC 2015：CSXS.6
* CC 2015.5：CSXS.7

#### Debug工作目录
* Windows
```
C:\Users\<USERNAME>\AppData\Roaming\Adobe\CEP\extensions
```
* OS X
```
/Users/<USERNAME>/Library/Application Support/Adobe/CEP/extensions
```
#### Debug in Chrome
在Debug工作目录的.debug文件（如果没有就创建一个）中设置端口号，然后访问http://localhost:8000。

#### Adobe CEP log
* windows
```
C:\Users\<USERNAME>\AppData\Local\Temp\CEP**
```
* OS X
```
/Users/<USERNAME>/Library/Logs/CSXS/CEP**
```
