importScripts('/socket.io/socket.io.js');
var socket = io();
var selfDelay = 0;
var W = (function() {
    var onEventList = {};
    var Self = self;
    Self.onmessage = function(event) {
        var data = event.data,
            eType = data.type,
            eData = data.data;
        W.trigger(eType, eData);
    }
    return {
        /*与主线程通讯的事件*/
        emit: function(eType, data) {
            Self.postMessage({
                type: eType,
                data: data
            });
        },
        on: function(eType, handle) {
            if (!onEventList[eType]) {
                onEventList[eType] = [];
            }
            onEventList[eType].push(handle);
        },
        /*data必须为数据数组*/
        trigger: function(eType) {
            var fns = onEventList[eType],
                data = Array.prototype.slice.call(arguments, 1);
            if (!fns || fns.length === 0) {
                return false;
            }
            for (var i = 0, fn; fn = fns[i++];) {
                fn.apply(this, data);
            }
        },
        off: function(eType, fn) {
            var fns = onEventList[eType];
            if (!fns) {
                return false;
            }
            if (!fn) {
                fns && (fns.length = 0);
            } else {
                for (var len = fns.length - 1; len >= 0; len--) {
                    var _fn = fns[len];
                    if (_fn === fn) {
                        fns.splice(len, 1);
                    }
                }
            }
        }
    }
}());
/*与主线程通讯的配置文件*/
var wokConfigs = [{
    type: 'login'
}, {
    type: 'typing'
}, {
    type: 'stopTyping'
}, {
    type: 'msg'
}];
/*与服务器通讯的事件配置*/
var socketConfigs = [{
    type: 'login'
}, {
    type: 'userJoin'
}, {
    type: 'leave'
}, {
    type: 'typing'
}, {
    type: 'stopTyping'
}, {
    type: 'msg'
}];
/*与游戏进程通讯事件配置*/
var gameCtrlConfigs = [{
    type: 'move',
    handle: function(data) {
        data.delay = selfDelay;
        return data;
    }
}, {
    type: 'amend',
    handle: function(data) {
        data.delay = selfDelay;
        return data;
    }
}, {
    type: 'answer'
}];
/*与游戏服务器通讯的时间配置*/
var gameServerConfig = [{
    type: 'move',
    handle: function(data) {
        data.delay += selfDelay;
        return data;
    }
}, {
    type: 'amend',
    handle: function(data) {
        data.delay += selfDelay;
        return data;
    }
},
{
    type: 'answer'
}];

function ManageWok(configs, form, to) {
    for (var i = 0, item = null; item = configs[i++];) {
        var type = item.type,
            handle = item.handle;
        if (!type) return;
        (function(type, handle) {
            form.on(type, function(data) {
                if (handle && typeof handle === 'function') {
                    data = handle(data);
                }
                to.emit(type, data);
            });
        })(type, handle);
    }
};
/*与主进程通讯*/
ManageWok(wokConfigs, W, socket);
/*与服务器通讯的部分*/
ManageWok(socketConfigs, socket, W);
/*游戏主线程通讯*/
ManageWok(gameCtrlConfigs, W, socket);
/*与游戏服务器进行通讯*/
ManageWok(gameServerConfig, socket, W);



/*更新游戏时间延时*/
socket.on('delay', function(data) {
    socket.emit('delay', data);
});
socket.on('upDelay', function(data) {
    selfDelay = data.delay;
});
console.log('耶耶耶~~~线程正常运行！');
