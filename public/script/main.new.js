var $DOC = $(document);
$DOC.ready(function () {
	//初始化主要是对公共数据与方法的初始化
	var ME = {
		USER: {
			userName: '',
			userId: '',
			connected: false,
			typing: false,
			START_INPUT_TIME: 0,
			TYPING_TIMER_LENGTH: 800
		},
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
		METHODS: {},
		WOK: {},
		GAME: {}
	};
	// 线程生成方法姑且写成一个工厂方法，目前只用到一个线程
	ME.METHODS.FactoryWorker = function (workerUrl) {
		if (!window.Worker) return console.log('您的浏览器不支持worker');
		var worker = new Worker(workerUrl),
			$event = $({});
		// 加上一层包装用于与线程通讯
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
	// 用于绑定键盘的输入的,只当输入框获取焦点时才进行输入，离开时解绑定输入
	ME.METHODS.BindKeyDown = function ($input, primise, handle) {
			var go = function (event) {
				var result = primise($input);
				if (event.ctrlKey || event.metaKey || event.altKey) return;
				if (event.which === 13 && !!result) {
					handle($input, result);
				};
			};
			var infoucs = function (event) {
					ME.DOM.$window.on('keydown', go);
				},
				inblur = function (event) {
					ME.DOM.$window.off('keydown', go);
				};
			var ret = {
				bind: function () {
					$input.on('focus', infoucs);
					$input.on('blur', inblur);
				},
				unbind: function () {
					$input.off('focus', infoucs);
					$input.off('blur', inblur);
				}
			};
			ret.bind();
			return ret;
		}
		// 管理线程的通讯事件
	ME.METHODS.ManageWok = function (configs, WOK) {
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
	};
	// 用于危险字符的转义
	ME.METHODS.CleanInput = function (input) {
		return $('<div/>').text(input).text();
	};
	ME.WOK = ME.METHODS.FactoryWorker('script/chatWorker.js');

	(function init() {
		var inputUname = '';
		var bindLoginInput = ME.METHODS.BindKeyDown(ME.DOM.$joinInput,
			function ($input) {
				/*回车执行的先决条件*/
				return inputUname = $input.val().trim();
			},
			function ($input, msg) {
				/*回车可执行的事件*/
				inputUname = msg;
				ME.DOM.$joinBtn.trigger('click');
			});
		$DOC.trigger('initChatRoom', ME);
		$DOC.trigger('initHandlePanel', ME);
		ME.DOM.$joinBtn.on('click', function (event) {
			event.preventDefault();
			if (!inputUname) return;
			ME.USER.userName = inputUname;
			ME.DOM.$login.hide(500, function () {
				ME.DOM.$main.show(500);
			});
			ME.DOM.$joinBtn.off('click');
			bindLoginInput.unbind();
			$DOC.trigger('initGame', ME);
		});

	})();
});



/*这里是初始化控制面板的*/
$DOC.on('initHandlePanel', function (event, ME) {
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
	$DOC.off('initHandlePanel');
});







/*初始化聊天室*/
$DOC.on('initChatRoom', function (event, ME) {
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
	};
	var MngMsg = ManageMsg(ME.DOM.$groupChatMsgWrapper, ME.DOM.$groupChatBtn, ME.DOM.$msgTemplate);
	var bindGroupMsgInput = ME.METHODS.BindKeyDown(ME.DOM.$groupChatInput,
		function ($input) {
			return (!ME.DOM.$groupChatPanel.data('hidden')) && $input.val().trim();
		},
		function ($input, msg) {
			var data = {
				msg: msg
			};
			ME.WOK.emit('msg', data);
			$input.val('');
			data.userName=ME.USER.userName;
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
	ME.METHODS.ManageWok(wokChatConfigs, ME.WOK);
	/*用户正在输入与停止事件的触发*/
	ME.DOM.$groupChatInput.on('input', function () {
		if (!ME.USER.connected) return;
		if (!ME.USER.typing) {
			ME.USER.typing = true;
			ME.WOK.emit('typing',{});
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
	})

});









/*初始化游戏*/
$DOC.on('initGame', function (event, ME) {
	ME.USER.connected = true;
	ME.USER.tagSet = {
		x:0,
		y:-80
	}
//	Q.debug=true;
	var SlaveManager = function () {
		var slavers = {};
		return {
			create: function (data, stage, Sprite) {
				var slaver = new Sprite(data.dest);
				stage.insert(slaver);
				addTag(data,ME.USER.tagSet,slaver,stage);
				slavers[data.userId] = slaver;
			},
			do: function (type, data, handle) {
				var slaver = slavers[data.userId];
				if (!slaver) console.log('对象不存在', data);
				slaver.trigger(type, data);
				if (handle) handle(slaver);
			}
		}
	}();
	var WOK = ME.WOK,
		GAME = ME.GAME;
	var wokGameConfig = [{
		type: "userJoin",
		handle: function (event, data) {
			console.log('have the other userjoin:', data);
			SlaveManager.create(data, Q.stage(0), Q.SlaverPlayer);
			WOK.emit('answer', {
				userId: data.userId,
				dest: GAME.currDest
			});
		}
	}, {
		type: "answer",
		handle: function (event, data) {
			console.log('在线用的应答：', data);
			SlaveManager.create(data, Q.stage(0), Q.SlaverPlayer);
		}
	}, {
		type: 'move',
		handle: function (event, data) {
			SlaveManager.do('move', data);
		}
	}, {
		type: 'amend',
		handle: function (event, data) {
			SlaveManager.do('amend', data);
		}
	}, {
		type: 'leave',
		handle: function (event, data) {
			SlaveManager.do('leave', data, function (slaver) {
				delete slaver;
			});
		}
	}];
	ME.METHODS.ManageWok(wokGameConfig, WOK);
	// 添加游戏角色控制
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
			// 用一个变量保存用户自身的位置
			GAME.currDest = {
				x: p.x >> 0,
				y: p.y >> 0
			};
			p.inputs = currInputs;
			/*判断用户控制是否发生改变*/
			if (oldInputs['up'] ^ currInputs['up'] |
				oldInputs['down'] ^ currInputs['down'] |
				oldInputs['left'] ^ currInputs['left'] |
				oldInputs['right'] ^ currInputs['right'] |
				oldInputs['action'] ^ currInputs['action']) {
				WOK.emit('move', {
					inputs: currInputs
				});
				/*判断用户是不是静止*/
				if (!(currInputs['up'] | currInputs['down'] | currInputs['left'] | currInputs['right'])) {
					WOK.emit('amend', {
						dest: GAME.currDest
					});
				}
			}

		}
	});
	Q.Player.extend('MasterPlayer', {
		init: function (p) {
			this._super(p, {});
			this.add('masterControls');
		}
	});
	Q.Player.extend('SlaverPlayer', {
		init: function (p) {
			this._super(p);
			this.on('move', this, 'move');
			this.on('amend', this, 'amend');
			this.on('leave', this, 'leave');
		},
		move: function (data) {
			console.log('用户移动中.....', data);
			var p = this.p;
			p.delay += data.delay;
			p.inputs = data.inputs;
		},
		amend: function (data) {
			console.log('位置修正......', data);
			var p = this.p,
				dest = data.dest,
				delay = (p.delay + data.delay) / 1000;
			console.log('delay:', delay);
			delay = delay > 0.2 ? delay : 0.2;
			p.delay = 0;
			this.animate({
				x: dest.x,
				y: dest.y
			}, delay, Q.Easing.Quadratic.InOut);

		},
		leave: function (data) {
			this.destroy();
		}
	});
	Q.scene("map", function (stage) {
		Q.stageTMX("mao.tmx", stage);
		var data = {
				x: Q.width * Math.random() >> 0,
				y: Q.height * Math.random() >> 0
			},
			masterPlayer = new Q.MasterPlayer(data);
		WOK.emit('login', {
			userName: ME.USER.userName,
			dest: data
		});
		stage.insert(masterPlayer);
		addTag({userName:ME.USER.userName},ME.USER.tagSet,masterPlayer,stage);
		stage.add("viewport").follow(masterPlayer);
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

	function addTag(data, set, obj, stage) {
		var button = new Q.UI.Button({
			label: data.userName,
			fill: "#fff",
			type:0,
			border: 1,
			radius: 10,
			y: set.y,
			x: set.x
		}, function () {
			console.log("面板属性", this.p);
		});
		stage.insert(button, obj);
	}
});
