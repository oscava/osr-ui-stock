(function(window) {
    //Stock列表
    var Stock = Class.extends({
        config: {
            item: {
                width: 8,
                padding: 1
            }
        },
        screens: {},
        $: function(element) {
            this.element = element;
            this.context = this.element.getContext("2d");
            this.context.item = this.config.item;
            this.datas = [];
            this.height = this.element.height;
            this.width = this.element.width;
            this.prints = {};
            this.p2k = {};
        },
        addData: function(data) {
            this.datas.push(data);
            for (var key in data) {
                for (var sub in this.screens) {
                    if (this.screens[sub].keymap[key]) {
                        this.screens[sub].addData(key, data[key]);
                    }
                }
            }
        },
        draw: function(beginindex) {
            // if(!this.deb){
                var self = this;
                var fn = function(beginindex){
                    var index = 0;
                    if(beginindex<0)return;
                    beginindex = beginindex || 0;
                    self.context.clearRect(0, 0, self.width, self.height);
                    for (var key in self.screens) {
                        var _index = self.screens[key].check(beginindex);
                        self.screens[key].draw();
                        if(_index>index){
                            index = _index;
                        }
                    }
                    return index;
                }
                // this.deb = this.debounce(100,fn);
            // }
			// this.deb(beginindex);
            return fn(beginindex);
        },
        drawLast: function(){
            var index = 0;
            for (var key in this.screens) {
                var _index = this.screens[key].check();
                this.screens[key].draw();
                if(_index>index){
                    index = _index;
                }
            }
            return index;
        },
        debounce : function( delay , action){
            var last;
            return function(){
                var ctx = this, args = arguments
                clearTimeout(last)
                last = setTimeout(function(){
                    action.apply(ctx, args)
                }, delay)
            }
        },
        addScreen: function(name, size, position, config) {
            if (!this.screens[name]) {
                this.screens[name] = new Screen(name, this.context, size || {
                    width: this.width,
                    height: this.height
                }, position, config);
            }
            return this.screens[name];
        }
    });

    var Screen = Class.extends({
        
        addData: function(key, data) {
            if (!this.datas[key]) {
                this.datas[key] = [];
            }
            this.datas[key].push(data);
        },
        $: function(name, context, size, position, config) {
            this.name = name;
            this.context = context;
            this.size = size;
			this.position = position || { x:0,y:0 };
            this.keys = [];
			this.trueKeys = {};
            this.keymap = {};
            this.showdatas = [];
            this.datas = {};
            this.prints = {};
            this.max = 0;
            this.min = 0;
			this.item = {
				width: 8,
				padding: 1
			}
			this.config = config||{};
            this.config.zoom = this.config.zoom || { max: 1, min: 1 };
            var self = this;
            if(this.config.bg){
                if(this.config.bg.color){
                    this.bg = this.config.bg.color;
                }else if(this.config.bg.url){
                    var img = new Image();
                    img.src = this.config.bg.url;
                    img.onload = function(){
                        var ptrn = self.context.createPattern(img,'repeat');
                        self.bg = ptrn;
                    }
                }
            }
        },
        addPrint: function(print) {
            if (1 === arguments.length) {
                if (arguments[0] instanceof Print) {
                    return this.addPrintByPrint(arguments[0]);
                } else {
                    throw new Error("添加画笔错误");
                }
            } else {
                return this.addPrintByConfig(arguments[0], arguments[1], arguments[2], arguments[3]);
            }

        },
        addPrintByPrint: function(print) {
            this.prints[print.id] = print;
            var _this = this;
            print.keys.forEach(function(item, index) {
                if (!_this.keymap[item]) {
                    _this.keys.push(item);
                }
                _this.keymap[item] = true;
            });
			print.trueKeys.forEach(function(item,index){
                _this.trueKeys[item] = true;
			});
            print.setScreen(_this);
            return print;
        },
        addPrintByConfig: function(type, style, keys, range) {
            var print = null;
            if ("kline" == type) {
                print = new KLine(this.context, style, keys, range || {
                    width: this.width,
                    height: this.height
                });
            } else if ("line" == type) {
                print = new Line(this.context, style, keys, range || {
                    width: this.width,
                    height: this.height
                });
            }else if("stick" == type){
				print = new Stick(this.context, style, keys, range || { width:this.width,height:this.height});
			}else if("volume" == type){
				print = new Volume(this.context, style, keys, range || { width:this.width,height:this.height});
			}else if("colorBar" == type){
                print = new ColorBar(this.context, style, keys, range || { width: this.width, height: this.height });
            }
            return this.addPrintByPrint(print);
        },
        check: function(beginindex) {
            var length = Math.ceil(this.size.width / (this.item.width + this.item.padding * 2));
            var _length = 0;
            for(var key in this.datas){
                if(this.datas[key].length>_length){
                    _length = this.datas[key].length;
                }
            }
            if(undefined == beginindex){
                beginindex = _length - length - 1;
            }
            if((_length - length) <= beginindex){
                beginindex = _length - length - 1;
            }
            var max = null;
            var min = null;
            var _this = this;
            this.keys.forEach(function(item, index) {
                if(!_this.datas[item]){
                    return;
                }
                var array = _this.datas[item].slice(beginindex, Math.min(beginindex + length,_this.datas[item].length-1));
				_this.shownumber = array.length;
                var tmpmax = Math.max.apply(null, array);
                var tmpmin = Math.min.apply(null, array);
                if("high" == item){
                    _this.kmax = tmpmax;
                }
                if("low" == item){
                    _this.kmin = tmpmin;
                }
                if (null == max) {
                    max = tmpmax;
                }
                if (null == min) {
                    min = tmpmin;
                }
                if (tmpmax > max && _this.trueKeys[item]) {
                    max = tmpmax;
                }
                if (tmpmin < min && _this.trueKeys[item]) {
                    if(0 !== tmpmin){
                        min = tmpmin;
                    }
                }
                if (!array) return;
                array.forEach(function(_item, _index) {
                    if (!_this.showdatas[_index]) {
                        _this.showdatas[_index] = {};
                    }
                    _this.showdatas[_index][item] = _item;
                });
            });
            this.max = (this.config.max || max)*this.config.zoom.max;
            this.min = (this.config.min || min)*this.config.zoom.min;
            return beginindex;
        },
        draw: function() {
            this.context.clearRect(this.position.x,this.position.y,this.size.width,this.size.height);
            if(this.bg){
                this.context.fillStyle = this.bg;
                this.context.fillRect(this.position.x,this.position.y,this.size.width,this.size.height);
            }
            for (var key in this.prints) {
                this.prints[key].draw();
            }
        },
        increaseItem: function(number) {
            this.item.width += (number || .1);
            this.item.width = this.item.width;
            this.item.padding = this.item.width / 8;

        },
        decreaseItem: function(number) {
            this.item.width -= (number || .1);
            if (this.item.width < 0) {
                this.item.width = .1;
            }
            this.item.padding = this.item.width / 8;
            this.item.width = this.item.width;
        },
		getY:function(y){
			return (this.max - y) * this.size.height / (this.max - this.min) + (this.position.y);
		},
		getX:function(x){
			return this.position.x + x;
		}
    });

    var Line = Class.extends({
        _defaultStyle: {
            color: "#000",
            weight: 1
        },
        isShow: true,
        $: function(context, style, keys ) {
            this.id = Date.now() + "$" + Math.random();
            this.context = context;
            this.style = style || this._defaultStyle;
            this.keys = keys || this._defaultKeys;
			this.trueKeys = this.__trueKey || this.keys;
        },
        offsetPosition: function(x) {
            return x * 10 % 10 == 5 ? x : x + .5;
        },
        setScreen: function(screen) {
            this.screen = screen;
        },
        getY: function(y) {
			return this.screen.getY(y);
        },
		getX: function(x){
			return this.screen.getX(x);
		},
        draw: function() {
            var _this = this;
            if (!this.isShow) return;
            this.screen.showdatas.forEach(function(item, index) {
				if(index>=_this.screen.shownumber)return;
                var last = null;
                var now = null;
                if (1 == _this.keys.length) {
                    last = _this.screen.showdatas[index - 1] == null ? 0 : _this.screen.showdatas[index - 1][_this.keys[0]];
                    now = _this.screen.showdatas[index][_this.keys[0]];
                } else {
                    last = _this.screen.showdatas[index - 1];
                    now = _this.screen.showdatas[index];
                }
				_this.beginPath();
                _this.onDraw(last, now, index);
				_this.closePath();
            });
        },
        beginPath: function() {
            this.context.beginPath();
            this.context.strokeStyle = this.style.color;
            this.context.lineWidth = this.style.weight||1;
            this.context.fillStyle = this.style.color;
        },
        closePath: function() {
            this.context.closePath();
        },
        onDraw: function(last, now, index) {
            if (!last) return;
            this.beginPath();
            // var lx = this.offsetPosition(this.getX((index - 1) * (this.screen.item.width + this.screen.item.padding * 2)));
            // var nx = this.offsetPosition(this.getX( index * (this.screen.item.width + this.screen.item.padding * 2)));
            var lx = this.getX((index - 1) * (this.screen.item.width + this.screen.item.padding * 2));
            var nx = this.getX( index * (this.screen.item.width + this.screen.item.padding * 2));
            var ly = this.getY(last);
            var ny = this.getY(now);
            this.context.moveTo(lx, ly);
            this.context.lineTo(nx, ny);
            this.context.stroke();
            this.closePath();
        }
    });

    var KLine = Line.extends({
        _defaultStyle: {
            color: "#ff0000",
            weight: 1,
            bear: {
                color: "green"
            },
            bull: {
                color: "red"
            },
            max : {
                color: "greenyellow"
            },
            min : {
                color: "yellow"
            }
        },
        _defaultKeys: ["open", "close", "high", "low"],
        onDraw: function(last, now, index) {
            this.beginPath();
            var isBear = false;
            if (now.close < now.open) {
                isBear = true;
            } else {
                isBear = false;
            }
            if (isBear) {
                this.context.strokeStyle = this.style.bear.color;
                this.context.fillStyle = this.style.bear.color;
            } else {
                this.context.strokeStyle = this.style.bull.color;
                this.context.fillStyle = this.style.bull.color;
            }
            var x = this.offsetPosition(this.getX(index * (this.screen.item.width + this.screen.item.padding * 2)));
            var lztop = Math.max(now.close, now.open);
            var linetopfrom = this.getY(now.high);
            var linetopto = this.getY(lztop);
            var linebottomto = this.getY(now.low);
            var lzx = this.offsetPosition(this.getX(index * (this.screen.item.width + this.screen.item.padding * 2) - (this.screen.item.width / 2)));
            var height = Math.abs(this.getY(now.open) - this.getY(now.close));
            this.context.moveTo(x, linetopfrom);
            this.context.lineTo(x, linetopto);
            if(now.high == this.screen.kmax){
                // this.context.fillText("↑",x,linebottomto);
                this.context.fillStyle = this.style.max.color;
                this.context.strokeStyle = this.style.max.color;
                // this.context.fill();
            }else if(now.low == this.screen.kmin){
                // this.context.fillText("↑",x,linebottomto);
                this.context.fillStyle = this.style.min.color;
                this.context.strokeStyle = this.style.min.color;
                // this.context.fill();
            }
            if (!isBear) {
                this.context.rect(lzx, this.getY(lztop), this.screen.item.width, height);
            } else {
                this.context.rect(lzx, this.getY(lztop), this.screen.item.width, height);
                this.context.fill();
            }
            
            this.context.moveTo(x, this.getY(Math.min(now.open, now.close)));
            this.context.lineTo(x, linebottomto);
            this.context.stroke();
            this.closePath();
        }
    });

	var Stick = Line.extends({
		_defaultStyle:{
			color:"#ff0000",
			weight:1,
		},
		onDraw:function( last, now, index){
			this.beginPath();
			var x = this.offsetPosition(this.getX(index*(this.screen.item.width+this.screen.item.padding*2)));
			var y = this.getY(now);
			this.context.moveTo(x,this.getY(0));
			this.context.lineTo(x,y);
			this.context.stroke();
			this.closePath();
		}
	});
	
	var Volume = Stick.extends({
		_defaultStyle:{
			bear:{
				color:"green",
				weight:1
			},
			bull:{
				color:"red",
				weight:1
			}
		},
		_defaultKeys: ["volume", "close","open"],
		__trueKey:["volume"],
		onDraw:function( last, now, index ){
			var isBear = now.open > now.close;
			this.beginPath();
			if(isBear){
				this.context.strokeStyle = this.style.bear.color;
				this.context.lineWidth = this.style.bear.weight ||1;
			}else{
				this.context.strokeStyle = this.style.bull.color;
				this.context.lineWidth = this.style.bull.weight ||1;
			}
			var x = this.offsetPosition(this.getX(index*(this.screen.item.width+this.screen.item.padding*2)));
			var y = this.getY(now.volume);
			this.context.moveTo(x,this.getY(0));
			this.context.lineTo(x,y);
			this.context.stroke();
			this.closePath();
		}
	});
    
    var ColorBar = Line.extends({
        _defaultStyle:{
            color:"#ff0000",
            width:1,
            bear:{
                color:"green"
            },
            bull:{
                color:"red"
            }
        },
        onDraw: function( last, now, index ){
            if(!last)return;
            this.beginPath();
            var isBear = false;
            // var nx = this.offsetPosition(this.getX(index*(this.screen.item.width+this.screen.item.padding*2)));
            var nx = this.getX(index*(this.screen.item.width+this.screen.item.padding*2))+.2;
            // var lx = this.offsetPosition(this.getX((index-1)*(this.screen.item.width+this.screen.item.padding*2)))-0.4;
            var lx = this.getX((index-1)*(this.screen.item.width+this.screen.item.padding*2))-.2;
            var y1 = this.getY(now[this.keys[0]]);
            var y2 = this.getY(now[this.keys[1]]);
            var yl1 = this.getY(last[this.keys[0]]);
            var yl2 = this.getY(last[this.keys[1]]);
            this.context.moveTo(lx,yl1);
            this.context.lineTo(lx,yl2);
            this.context.lineTo(nx,y2);
            this.context.lineTo(nx,y1);
            this.context.lineTo(lx,yl1);
            if( y1 > y2 && yl1 > yl2 ){
                this.context.fillStyle = "green";
            }else if( y1 < y2 && yl1 < yl2 ){
                this.context.fillStyle = "red";
            }else{
                this.context.fillStyle = "#666";
            }
            this.context.fill();
            // this.context.stroke();
            this.closePath();
        }
    })
    
    this.Stock = Stock;
    // this.Line = Line;
    // this.KLine = KLine;
})(this);
