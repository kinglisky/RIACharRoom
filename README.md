#基于H5与Node的富媒体多人在线(游戏)聊天室

 学了一段时间的[Quintus](http://www.html5quintus.com/)游戏引擎，国外引擎，api没写全，国内又没教程，硬是看着源码学的api。引擎挺不错，压缩完才60多k。最不错的地方  是，它支持Tiled的TMX地图块文件，编写游戏地图方便了不少。不过游戏的素材好少啊，不喜欢那种绿色调的rpg地图，地图块太小，渲染比较吃内存。
 
 最早是想做一个小游戏的，然后各种加，然后有了聊天室功能，和在线游戏（还叫不上是游戏的吧）的功能，汗·····。
 
 主要用的技术，前台为：**canvas、web worker、web socket**，后台为：**node**用的express与socket.io。演示托管在coding上面
 
 
 [看这里](http://riacharoom.coding.io/) 刚进入是位置是随机的，有时会跑到边界去...刷新一下就好了，**单击页面获取焦点，控制是上下左右**
 
 直接访问就能看到啦，可以多开几个网页，程序员同志们，用双屏可以分开来看效果。单屏的请把页面独立开在两个浏览器窗口，不然人物会有跳动。
 
 
 然后用官网的图片素材做了个简单的，有时间我会慢慢改的，目前做出来的只是个概念原型。
 
 
 
 有用到的技术有 web wokers,webSocket游戏引擎是基于canvas的。wokers用于与后台通讯，减轻UI的的负担。
 
 后台用的是Node框架为Express+socke.io;
 


[早期的版本](http://nangame.coding.io/)

[github项目地址](https://github.com/kinglisky/RIACharRoom)
