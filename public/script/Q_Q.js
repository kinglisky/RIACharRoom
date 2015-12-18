$(document).ready(function () {
	var Q = window.Q = Quintus({

		})
		.include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
		.setup("QWrapper",{
			maximize: true
		})
		.touch()
		.controls(true);
	Q.component("basePlatformerControls", {
		defaults: {
			speed: 200,
			jumpSpeed: -300,
			collisions: []
		},

		added: function () {
			var p = this.entity.p;
			p.inputs = {
				up: 0,
				down: 0,
				left: 0,
				right: 0,
				action: 0
			};
			Q._defaults(p, this.defaults);
			this.entity.on("step", this, "step");
			this.entity.on("bump.bottom", this, "landed");

			p.landed = 0;
			p.direction = 'right';
		},
		/*判断是否与地面接触*/
		landed: function (col) {
			var p = this.entity.p;
			p.landed = 1 / 5;
		},

		step: function (dt) {
			var p = this.entity.p;

			if (p.ignoreControls === undefined || !p.ignoreControls) {
				var collision = null;

				// Follow along the current slope, if possible.
				if (p.collisions !== undefined && p.collisions.length > 0 && (p.inputs['left'] || p.inputs['right'] || p.landed > 0)) {
					if (p.collisions.length === 1) {
						collision = p.collisions[0];
					} else {
						// If there's more than one possible slope, follow slope with negative Y normal
						collision = null;

						for (var i = 0; i < p.collisions.length; i++) {
							if (p.collisions[i].normalY < 0) {
								collision = p.collisions[i];
							}
						}
					}

					// Don't climb up walls.
					if (collision !== null && collision.normalY > -0.3 && collision.normalY < 0.3) {
						collision = null;
					}
				}

				if (p.inputs['left']) {
					p.direction = 'left';
					if (collision && p.landed > 0) {
						p.vx = p.speed * collision.normalY;
						p.vy = -p.speed * collision.normalX;
					} else {
						p.vx = -p.speed;
					}
				} else if (p.inputs['right']) {
					p.direction = 'right';
					if (collision && p.landed > 0) {
						p.vx = -p.speed * collision.normalY;
						p.vy = p.speed * collision.normalX;
					} else {
						p.vx = p.speed;
					}
				} else {
					p.vx = 0;
					if (collision && p.landed > 0) {
						p.vy = 0;
					}
				}

				if (p.landed > 0 && (p.inputs['up'] || p.inputs['action']) && !p.jumping) {
					p.vy = p.jumpSpeed;
					p.landed = -dt;
					p.jumping = true;
				} else if (p.inputs['up'] || p.inputs['action']) {
					this.entity.trigger('jump', this.entity);
					p.jumping = true;
				}

				if (p.jumping && !(p.inputs['up'] || p.inputs['action'])) {
					p.jumping = false;
					this.entity.trigger('jumped', this.entity);
					if (p.vy < p.jumpSpeed / 3) {
						p.vy = p.jumpSpeed / 3;
					}
				}
			}
			p.landed -= dt;
		}
	});
	Q.Sprite.extend("Player", {
		init: function (p) {
			this._super(p, {
				sheet: "player",
				sprite: "player",
				direction: "right",
				jumpSpeed: -900,
				speed: 300,
				type: 1,
				points: [[-16, 44], [-23, 35], [-23, -48], [23, -48], [23, 35], [16, 44]],
				delay:0
			});
			this.add('2d, basePlatformerControls,animation, tween');

		},
		step: function (dt) {
			var that = this;
			var p = this.p;
			if (p.vx > 0) {
				if (p.landed > 0) {
					that.play("walk_right");
				} else {
					that.play("jump_right");
				}
				p.direction = "right";
			}
			if (p.vx < 0) {
				if (p.landed > 0) {

					that.play("walk_left");
				} else {
					that.play("jump_left");
				}
				p.direction = "left";
			}
			if (p.vx === 0) {
				that.play("stand_" + p.direction);
			}
		}

	});
});
