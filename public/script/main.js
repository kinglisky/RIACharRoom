$(document).ready(function () {
	var ME = {
		/*自定义数据*/
		USER: {
			userName: '',
			userId: '',
			connected: false,
			typing: false,
			START_INPUT_TIME: 0,
			TYPING_TIMER_LENGTH: 800
		},
		/*dom相关*/
		DOM: {
			$window: $(window),
			$joinBtn: $('#joinBtn'),
			$joinInput: $('#joinInput'),
			$login: $('div.login'),
			$main: $('div.main'),
			$handlePanle: $('ul.handle-panel'),
			$groupChatPanel: $('div.group-chat-panel'),
			$groupChatMsgWrapper: $('#group-msg-wrapper'),
			$groupChatInput: $('#group-msg-input'),
			$groupChatBtn: $('#groupChatRoom'),
			$msgTemplate: $('#msgTemplate'),
		},
		/*与线程通讯用的*/
		WOK: FactoryWorker('script/chatWorker.js')
	};
	var Q = window.Q;
	/*绑定的输入对象，前提执行函数，确定执行函数*/
	function BindKeyDown($input, premise, fn) {
		var msg = '';
		var handle = function (event) {
			msg = premise($input);
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			$input.focus();
			if (event.which === 13 && !!msg) {
				fn($input, msg);
			}
		};
		$input.on('focus', function () {
			ME.DOM.$window.on('keydown', handle);
		});
		$input.on('blur', function () {
			ME.DOM.$window.off('keydown', handle);
		});
		return {
			unbind: function () {
				ME.DOM.$window.off('keydown', handle);
			}
		};
	}
	/*线程工厂，包装产生出可以与后台直接进行事件通讯的wok对象*/
	function FactoryWorker(workerUrl) {
		if (!window.Worker) return;
		var worker = new Worker(workerUrl),
			/*这里单单借用jquery的事件属性*/
			$event = $({});
		/*加上一层包装用于与线程通讯*/
		var W = {
			emit: function (type, data) {
				worker.postMessage({
					type: type,
					data: data
				});
			},
			on: function (type, fn) {
				$event.on(type, fn);
			},
			off: function (type, fn) {
				$event.off(type, fn);
			}
		};
		worker.onmessage = function (event) {
			var EData = event.data,
				type = EData.type,
				data = EData.data;
			$event.trigger(type, data);
		}
		return W;
	};

	/*消息管理中心，消息的移除，通知控制面板*/
	function ManageMsg($wrapper, $notice, $template) {
		var msgTemplate = $template.html(),
			buildTemplate = window.juicer(msgTemplate),
			msgList = [],
			typingMsgList = {};
		/*消息记录比较多时删除掉一些消息*/
		$wrapper.on('removeMsg', function (event) {
			var index = 0;
			while (index++ < 30) {
				var $item = msgList.shift();
				$item.remove();
			}
			$wrapper.trigger('scrollBottom');
		});
		/*随消息改变滚动条*/
		$wrapper.on('scrollBottom', function () {
			var scrollHeight = $wrapper[0].scrollHeight;
			$wrapper.animate({
				scrollTop: scrollHeight
			}, 500);
		});
		/*有消息时改变功能面板的状态*/
		$notice.on('prompt', function (event) {
			console.log('add prompt!!!');
			if ($notice.data('hidden')) {
				$notice.addClass('prompt');
			}
		});
		return {
			log: function (type, data) {
				data.type = type;
				var msg = buildTemplate.render(data);
				msgList.push($(msg).appendTo($wrapper));
				/*触发滚动消息列表的事件*/
				$wrapper.trigger('scrollBottom');
				/*出发面板的消息提示*/
				$notice.trigger('prompt');
				/*消息达到上限是截取消息列表*/
				if (msgList.length >= 50) {
					$wrapper.trigger('removeMsg');
				}
			},
			logTypMsg: function (type, data) {
				var userId = data.userId;
				if (typingMsgList[userId]) return;
				data.type = type;
				var msg = buildTemplate.render(data);
				typingMsgList[userId] = $(msg).appendTo($wrapper);
				$notice.trigger('scrollBottom');
			},
			rmTypMsg: function (data) {
				var userId = data.userId;
				if (!userId) return;
				typingMsgList[userId].fadeOut(600, function () {
					$(this).remove();
				});
				delete typingMsgList[userId];
				$notice.trigger('scrollBottom');

			}
		};
	}
	/*管理通讯的线程*/
	function MangeeWok(configs, WOK) {
		for (var i = 0, item = null; item = configs[i++];) {
			var type = item.type,
				handle = item.handle;
			/*事件或处理程序不存在则之间返回*/
			if (type || (handle && typeof handle === 'function')) {
				(function (type, handle) {
					WOK.on(type, handle);
				})(type, handle);
			}
		}
	}
	/*初始化面板，添加面板的开关*/
	function initHandelPanel() {
		/*这里有与dom 的data-panel属性挂钩*/
		var Panles = {
			"groupChatRoom": ME.DOM.$groupChatPanel
		};
		ME.DOM.$handlePanle.on('click', 'li', function (event) {
			var $this = $(this),
				panelName = $(this).data('panel'),
				isHidden = $(this).data('hidden');
			if (!!!panelName) return;
			var $panel = Panles[panelName];
			$this.removeClass('prompt');
			$this.data('hidden', !isHidden);
			$panel.data('hidden', !isHidden);
			$panel.slideToggle(500);
		});
	}
	//  初始化聊天室，这里有与后台交互的功能
	function initChatRoom() {
		var MngMsg = ManageMsg(ME.DOM.$groupChatMsgWrapper, ME.DOM.$groupChatBtn, ME.DOM.$msgTemplate);
		/*用户发送消息*/
		var bindGroupMsgInput = BindKeyDown(ME.DOM.$groupChatInput,
			function ($input) {
				return (!ME.DOM.$groupChatPanel.data('hidden')) && $input.val().trim();
			},
			function ($input, msg) {
				var data = {
					userName: ME.USER.userName,
					msg: msg
				};
				ME.WOK.emit('msg', data);
				$input.val('');
				MngMsg.log('left', data);
			});
		/*聊天室通讯的事件处理配置*/
		var wokChatConfigs = [
			{
				type: 'login',
				handle: function (event, data) {
					ME.USER.userId = data.userId;
					data.userName = ME.USER.userName;
					MngMsg.log('join', data);
				}
			}, {
				type: 'userJoin',
				handle: function (event, data) {
					MngMsg.log('join', data);
				}
			},
			{
				type: 'leave',
				handle: function (event, data) {
					MngMsg.log('leave', data);
				}
			},
			{
				type: 'typing',
				handle: function (event, data) {
					MngMsg.logTypMsg('typing', data);
				}
			},
			{
				type: 'stopTyping',
				handle: function (event, data) {
					MngMsg.rmTypMsg(data);
				}
			},
			{
				type: 'msg',
				handle: function (event, data) {
					MngMsg.log('right', data);
				}
			}];
		MangeeWok(wokChatConfigs, ME.WOK);
		/*用户正在输入与停止事件的触发*/
		ME.DOM.$groupChatInput.on('input', function () {
			if (!ME.USER.connected) return;
			if (!ME.USER.typing) {
				ME.USER.typing = true;
				ME.WOK.emit('typing', {
					userName: ME.USER.userName
				});
			}
			ME.USER.START_INPUT_TIME = +new Date();
			setTimeout(function () {
				var typingTime = +new Date();
				var timeDiff = typingTime - ME.USER.START_INPUT_TIME;
				if (timeDiff >= ME.USER.TYPING_TIMER_LENGTH && ME.USER.typing) {
					ME.WOK.emit('stopTyping', {});
					ME.USER.typing = false;
				}
			}, ME.USER.TYPING_TIMER_LENGTH);
		});

	};
	//	初始化用户角色地图，这里也有
	function initGame(username) {
		var gameConfigs = [];
		ME.USER.userName = username;
		ME.USER.connected = true;

		ME.WOK.emit('login', {
			userName: username
		});
		Q.component('masterControls', {
			added: function () {
				this.entity.on("step", this, "step");
			},
			step: function (dt) {
				var p = this.entity.p,
					oldInputs = p.inputs,
					currInputs = {
						up: Q.inputs['up'] & 1,
						down: Q.inputs['down'] & 1,
						left: Q.inputs['left'] & 1,
						right: Q.inputs['right'] & 1,
						action: Q.inputs['action'] & 1
					};
				p.inputs = currInputs;

			}
		});
		Q.Player.extend('MasterPlayer', {
			init: function (p) {
				this._super(p, {});
				this.add('masterControls');
			}
		});
		Q.scene("map", function (stage) {
			Q.stageTMX("mao.tmx", stage);
			var data = {
				x: Q.width * Math.random() >> 0,
				y: Q.height * Math.random() >> 0
			}
			stage.insert(new Q.MasterPlayer(data));
			stage.add("viewport").follow(Q("MasterPlayer").last());
		});
		Q.loadTMX("mao.tmx, player.png,player.json", function () {
			Q.compileSheets("player.png", "player.json");
			Q.animations("player", {
				walk_right: {
					frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
					rate: 1 / 15,
					flip: false,
					loop: true
				},
				walk_left: {
					frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
					rate: 1 / 15,
					flip: "x",
					loop: true
				},
				jump_right: {
					frames: [13],
					rate: 1 / 10,
					flip: false
				},
				jump_left: {
					frames: [13],
					rate: 1 / 10,
					flip: "x"
				},
				stand_right: {
					frames: [14],
					rate: 1 / 10,
					flip: false
				},
				stand_left: {
					frames: [14],
					rate: 1 / 10,
					flip: "x"
				},
				duck_right: {
					frames: [15],
					rate: 1 / 10,
					flip: false
				},
				duck_left: {
					frames: [15],
					rate: 1 / 10,
					flip: "x"
				},
				climb: {
					frames: [16, 17],
					rate: 1 / 3,
					flip: false
				}
			});
			Q.stageScene("map");
		});
	}
	//  用于清除危险字符用的
	function cleanInput(input) {
		return $('<div/>').text(input).text();
	};
	(function init() {
		var inputUname = '';
		var bindLoginInput = BindKeyDown(ME.DOM.$joinInput,
			function ($input) {
				/*回车执行的先决条件*/
				return inputUname = $input.val().trim();
			},
			function ($input, msg) {
				/*回车可执行的事件*/
				inputUname = msg;
				ME.DOM.$joinBtn.trigger('click');
			});
		initChatRoom();
		initHandelPanel();
		ME.DOM.$joinBtn.on('click', function (event) {
			event.preventDefault();
			if (!inputUname) return;
			ME.DOM.$login.hide(500, function () {
				ME.DOM.$main.show(500);
			});
			ME.DOM.$joinBtn.off('click');
			bindLoginInput.unbind();
			initGame(cleanInput(inputUname));
		});
	}());
});
