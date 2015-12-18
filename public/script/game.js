$(document).ready(function () {
	var Q=window.Q;
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
	}, {
		progressCallback: function (loaded, total) {
			var element = document.getElementById("loading_progress");
			element.style.width = Math.floor(loaded / total * 100) + "%";
			if (loaded == total) {
				document.getElementById("loading").remove();
			}
		}
	});
});
