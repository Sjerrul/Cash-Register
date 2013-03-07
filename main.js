var productData = [
{"id": 1, "name": "Koffie", "price": 0.99},
{"id": 2, "name": "Thee", "price": 0.99},
{"id": 3, "name": "Cola", "price": 1.99},
{"id": 4, "name": "Wafel", "price": 1.99},
{"id": 5, "name": "+Slagroom", "price": 0.50},
{"id": 6, "name": "+Ijs", "price": 1.00}
];

var tableData = [
{"number": 1},
{"number": 2},
{"number": 3},
{"number": 4},
{"number": 5}
];


var viewModel = new ViewModel();

(function($){
	ko.applyBindings(viewModel);
})(jQuery);

function ViewModel() {
    var self = this;
	this.tables = ko.observableArray([])
	this.products = ko.observableArray([])
	this.activeTable = ko.observable()
	
	this.setAllTablesInactive = function () {
		$.each(tables, function() {
			this.setInactive();
		});
	}
			
	var tables = $.map(tableData, function (item) {
		return new Table(item);
	});
	
	var products = $.map(productData, function (item) {
		return new Product(item);
	});
	
	this.tables(tables);
	this.products(products)
}

function objectify(cartlines) {
	var newProducts = [];

	$.each(cartlines, function () {
		var cartline = new CartLine(new Product(this.product));
		cartline.amount(this.amount)
		cartline.created(this.created)
		cartline.modified(this.modified)
		newProducts.push(cartline);
	})
	
	return newProducts;
}

function Table(table) {
	var self = this;
	self.number = ko.observable(table.number);
	self.cartLines = ko.observableArray([], {persist: 'table' + self.number() + "-cartlines"});	
	self.cartLines(objectify(self.cartLines()));
	
	self.isActive = ko.observable(false);
	
	self.totalPrice = ko.computed(function() {
			var total = 0;
			$.each(self.cartLines(), function() {				
				total += Math.round(this.price() *Math.pow(10,2))/Math.pow(10,2);
			})
			return Math.round(total*Math.pow(10,2))/Math.pow(10,2);			
		});
	
	self.setActive = function () {
		viewModel.setAllTablesInactive();
		viewModel.activeTable(this);
		this.isActive(true);
	}
	
	self.pay = function () {
		$.post("http://www.test.nl/tasks", {
            data: ko.toJSON({ transaction: this }),
            type: "post", contentType: "application/json",
            success: function(result) { alert(result) }
        });
		self.cartLines([]);		
	}
	
	self.print = function () {
		window.print();		
	}
	
	self.setInactive = function () {
		this.isActive(false);
	}
	
	self.addProduct = function (product) {
		var incremented = false;
		$.each(self.cartLines(), function() {				
			if (this.product().id == product.id)
			{
				this.amount(this.amount() + 1);
				incremented = true;
				this.modified = ko.observable(new Date());
				refreshLocalStorage();
			}
		})
		
		if (!incremented) {
			this.cartLines.push(new CartLine(product));		
		}	
	}
	
	this.removeLine = function (product) {
		this.cartLines.remove(product);
	}
}

function CartLine(product) {
	var self = this;
	self.product = ko.observable(product);
	self.amount = ko.observable(1);
	self.selected = ko.observable(false);
	self.created = ko.observable(new Date());
	self.modified = ko.observable(new Date());
	
	self.price = ko.computed(function () {		
		price = self.product().price * self.amount(); 
		return Math.round(price*Math.pow(10,2))/Math.pow(10,2);
	})
	
	self.removeLine = function (product) {		
		viewModel.activeTable().removeLine(product);
	}
		
	self.decreaseOne = function (product) {	
		if (self.amount() == 1)
		{
			self.removeLine(product);
			self.modified = ko.observable(new Date());
			refreshLocalStorage();
			return;
		}
		
		self.amount(self.amount() - 1)
		refreshLocalStorage();
	}
	
	self.increaseOne = function (product) {	
		self.amount(self.amount() + 1);
		self.modified = ko.observable(new Date());
		refreshLocalStorage();
	}
}

function Product(product) {
	var self = this;
	self.id = product.id;
	self.name = product.name;
	self.price = product.price;	
	
	self.addToTable = function () {		
		viewModel.activeTable().addProduct(this);	
	}
}


//Helpers

function refreshLocalStorage() {
	viewModel.activeTable().cartLines(viewModel.activeTable().cartLines());
}
