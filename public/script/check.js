$(document).ready(function () {
	var checkList = ['canvas', 'canvastext', 'requestanimationframe', 'webworkers', 'websockets'],
		cantSupport = [];
	for (var i = 0, item = null; item = checkList[i++];) {
		if (!Modernizr[item]) {
			cantSupport.push(item);
		}
	}
	if (cantSupport.length === 0) return;
	else {
		var cantsup = cantSupport.join(','),
			$alert = $('.alert');
		$alert.text('亲，您的浏览器只是个养猪场开不了飞机的(￣ε ￣) 它不支持' + cantsup + '，建议您换个新的浏览器，IE9以前的浏览器就不要用了，谷歌火狐欧朋都不错。')
			.show(800)
			.delay(4000)
			.hide(500, function () {
				$alert.css({
					display: 'none'
				});
			});
	}
});
