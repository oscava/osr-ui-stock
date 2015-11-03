###OSR-UI-STOCK###

####How to use####

####npm####
	npm install osr-ui-stock
###bower###
	bower install osr-ui-stock

###这个是浏览器版本,切勿当作node_module模块引入###
		var stage = new Stock(document.getElementById("example"));
		var mainscreen = stage.addScreen("main");
		//var timescreen = stage.addScreen("time");
		window.kline = mainscreen.addPrint("kline",{ bear: "green", bull:"red" });
		window.low = mainscreen.addPrint("line",{ color:"#fff" },["low"]);
		window.high = mainscreen.addPrint("line",{ color:"red" },["high"]);
		window.close = mainscreen.addPrint("line",{ color:"blue" },["close"]);
		window.open = mainscreen.addPrint("line",{ color:"green" },["open"]);
		//window.time = timescreen.addPrint("line",{ color:"#fff" },["time"]);
		
		$("kline").addEventListener("click",fn);
		$("high").addEventListener("click",fn);
		$("low").addEventListener("click",fn);
		$("open").addEventListener("click",fn);
		$("close").addEventListener("click",fn);
		//$("time").addEventListener("click",fn);
		
		
		myData.stock.forEach(function(item,index){
			stage.addData(item);
		});
		var index = 0;
		stage.draw(index);
		document.body.addEventListener("keydown",function(e){
			console.log(e.keyCode);
			if(39 === e.keyCode){
				index++;
			}else if(37 === e.keyCode){
				if(--index < 0 ){
					index = 0;
				}
				stage.draw(index);
			}else if(38 === e.keyCode){
				mainscreen.increaseItem();
			}else if(40 === e.keyCode){
				mainscreen.decreaseItem();
			}
			stage.draw(index);
		})


![示例图](./images/demo1.png)

###Update###

>2015年11月3日(下午) 增加画成交量的线

>2015年11月2日 增加画竖线