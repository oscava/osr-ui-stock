(function(window){
	//Stock列表
	var Stock = Class.extends({
		config:{
			item:{
				width:8,
				padding:1
			}
		},
		$:function( element ){
			this.element = element;
			this.context = this.element.getContext("2d");
			this.context.item = this.config.item;
			this.datas = [];
			this.height = this.element.height;
			this.width = this.element.width;
			this.prints = {};
			this.p2k = {};
		},
		addData:function( data ){
			this.datas.push(data);
			var _this = this;
			for(var key in data){
				var prints = this.p2k[key];
				if(!prints)continue;
				prints.forEach(function(id,index){
					_this.prints[id].addData(key,data[key]);
				});
			}
		},
		draw:function(beginindex){
			var _this = this;
			beginindex = beginindex || 0;
			Object.keys(this.prints).forEach(function(id,index){
				_this.prints[id].check(beginindex);
				_this.prints[id].draw();
			});
		},
		addPrint:function( print ){
			this.prints[print.id] = print;
			var _this = this;
			print.keys.forEach(function(item,index){
				if(!_this.p2k[item]){
					_this.p2k[item] = [];
				}
				_this.p2k[item].push(print.id);
			});
		}
	});
	
	var Print = Class.extends({
		_defaultStyle:{
			color:"#000",
			weight:1
		},
		isShow: true,
		$:function( context , style , keys, range ){
			this.id = Date.now()+"$"+Math.random();
			this.context = context;
			this.style = style || this._defaultStyle;
			this.range = range;
			this.keys = keys;
			this.datas = {};//[];
			this.showdatas = [];
		},
		offsetPosition:function(x){
			return x*10%10 == 5 ? x : x+.5;
		},
		addData:function( key, data ){
			if(!this.datas[key]){
				this.datas[key] = [];
			}
			this.datas[key].push( data );
			// this.datas.push( data );
		},
		check:function( beginindex ){
			var length = Math.ceil(this.range.width / this.context.item.width);
			var _this = this;
			var max = null;
			var min = null;
			if(1===this.keys.length){
				this.showdatas = this.datas[this.keys[0]].slice( beginindex, beginindex + length );
				max = Math.max.apply(null,this.showdatas);
				min = Math.min.apply(null,this.showdatas);
			}else{
				this.keys.forEach(function(item,index){
					var tmpmax = Math.max.apply(null,_this.datas[item]);
					var tmpmin = Math.min.apply(null,_this.datas[item]);
					if(null == max){
						max = tmpmax;
					}
					if(null == min){
						min = tmpmin;
					}
					if(tmpmax > max){
						max = tmpmax;
					}
					if(tmpmin < min){
						min = tmpmin;
					}
					if(!_this.showdatas[index]){
						_this.showdatas[index] = {};
					}
					var array = _this.datas[item];
					if(!array)return;
					array.forEach(function(_item,_index){
						if(!_this.showdatas[_index]){
							_this.showdatas[_index] = {};
						}
						_this.showdatas[_index][item] = _item;
					});
				});
			}
			
			this.range.max = max;
			this.range.min = min;
		},
		getY:function( y ){
			return (this.range.max - y ) * this.range.height / ( this.range.max - this.range.min )
		},
		draw:function(){
			var _this = this;
			this.showdatas.forEach(function(item,index){
				_this.onDraw( _this.showdatas[index-1] , item , index );
			});
		},
		beginPath:function(){
			this.context.beginPath();
			this.context.strokeStyle = this.style.color;
			this.context.lineWidth = this.style.weight;
			this.context.fillStyle = this.style.color;
		},
		closePath:function(){
			this.context.closePath();
		},
		onDraw:function( last, now, index ){
			this.beginPath();
			this.context.moveTo((index-1)*(this.context.item.width),this.getY(last));
			this.context.lineTo(index*(this.context.item.width),this.getY(now));
			this.context.stroke();
			this.closePath();
		}
	});
	
	var KLine = Print.extends({
		_defaultStyle:{
			color:"#ff0000",
			weight:1
		},
		onDraw:function( last, now, index ){
			this.beginPath();
			this.context.moveTo( this.offsetPosition(index*(this.context.item.width+this.context.item.padding*2)),this.getY(now.low) );
			this.context.lineTo( this.offsetPosition(index*(this.context.item.width+this.context.item.padding*2)),this.getY(now.high) );
			var height = Math.abs( this.getY(now.open) - this.getY(now.close) );
			this.context.rect(this.offsetPosition(index*(this.context.item.width+this.context.item.padding*2)-(this.context.item.width/2)),this.getY(now.open),this.context.item.width,height);
			this.context.stroke();
			this.closePath();
		}
	});
	
	this.Stock = Stock;
	this.Print = Print;
	this.KLine = KLine;
})(this);
