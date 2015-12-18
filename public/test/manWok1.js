window.addEventListener('load', function () {
	var wok = new SharedWorker('workers.js','test');
	wok.port.postMessage('this is form the wok1 msg');
});
