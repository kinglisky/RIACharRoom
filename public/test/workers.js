var index=0;
self.port.onmessage=function(event){
	console.log('run in workers,the datais',event.data);
	console.log('the index is:',index++);
}
