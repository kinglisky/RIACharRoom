var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
var port = process.env.VCAP_APP_PORT || 3000;

server.listen(port, function() {
    console.log('服务器运行在localhost: %d', port);
});
// 静态文件托管目录
app.use(express.static(__dirname + '/public'));

var users = [],
    index = 0;
io.on('connection', function(socket) {
    socket.on('login', function(data) {
		index++;
        console.log('登录的用户：', data.userName);
		socket.userName=data.userName;
        socket.emit('login', {
            onlineNum: index,
			userId:socket.id
        });
        data.onlineNum=index,
        data.userId=socket.id;
        socket.broadcast.emit('userJoin',data);

    });
	socket.on('typing',function(data){
		data.userId=socket.id;
        data.userName=socket.userName;
		socket.broadcast.emit('typing',data);
	});
	socket.on('stopTyping',function(data){
		data.userId=socket.id;
        data.userName=socket.userName;
		socket.broadcast.emit('stopTyping',data);
	});
	socket.on('msg',function(data){
        data.userName=socket.userName;
		socket.broadcast.emit('msg',data);
	});
    /*用户离开*/
     socket.on('disconnect', function() {
     	index=index>0?--index:0;
		socket.broadcast.emit('leave',{userId:socket.id,userName:socket.userName,onlineNum:index});
    });
     /*这边是游戏控制*/
     socket.on('answer',function(data){
        var ndata={userId:socket.id,dest:data.dest,userName:socket.userName}
        socket.broadcast.to(data.userId).emit('answer',ndata);
     })
     socket.on('move',function(data){
        console.log('用户移动：',data);
       data.userId=socket.id;
        socket.broadcast.emit('move',data);
     });

     socket.on('amend',function(data){
        data.userId=socket.id;
        console.log('用户停止移动进行位置修正：',data);
        socket.broadcast.emit('amend',data);
     });

    /*检测时间延迟用的*/
    socket.on('delay', function(data) {
        var delay = ((+new Date() - data.start) / 2) >> 0;
        socket.emit('upDelay', {
            delay: delay
        });
    });
    socket.emit('delay', {
        start: +new Date()
    });
    (function upDelay() {
        var T = setTimeout(function() {
            socket.emit('delay', {
                start: +new Date()
            });
            upDelay();
        }, 2000);
    }());
});
