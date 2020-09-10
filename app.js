var budgetController = (function() {
	var Expense = function(id,description,value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	}

	Expense.prototype.calcPercentage = function(totalIncome) {
		if (totalIncome>0) {
			this.percentage = Math.round((this.value/totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	}

	Expense.prototype.getPercentage = function () {
		return this.percentage;
	}

	var Income = function(id,description,value) {
		this.id = id;
		this.description = description;
		this.value = value;
	}

	var calcTotal = function(type) {
		var sum=0;
		data.allItems[type].forEach(function(curr) {
			sum += curr.value;
		});

		data.totals[type] = sum;
	};

	var data = {
		allItems : {
			exp: [],
			inc: [],
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget:0,
		percentage:-1
	};

	return {
		addItem : function(type,des,val) {
			var newItem,ID;
			
			// Create new item ID which is +1 than the latest item, or if it's the first item, then it's 0
			if (data.allItems[type].length>0) {
				ID = data.allItems[type][data.allItems[type].length-1].id+1;
			} else {
				ID = 0;
			}


			// Create new item based on type
			if (type==='inc') {
				newItem = new Income (ID,des,val);
			} else if (type==='exp') {
				newItem = new Expense (ID,des,val);
			}
			
			// Push it into allItems
			data.allItems[type].push(newItem);

			// return the created element
			return newItem;	
		},
		deleteItem : function(type,id) {
			var ids, index;

			ids = data.allItems[type].map(function(curr) {
				return curr.id;
			});

			index = ids.indexOf(id);

			if (index!==-1) {
				data.allItems[type].splice(index,1);
			}
		},
		calcBudget : function () {
			// calculate the total income and expenses
			calcTotal('exp');
			calcTotal('inc');

			// calculate the total budget: income-expenses
			data.budget = data.totals.inc-data.totals.exp;

			// calculate the percentage of the income that we spent
			if (data.totals.inc>0) {
				data.percentage = Math.round((data.totals.exp/data.totals.inc)*100);
			} else {
				data.percentage = -1;
			}
		},
		getBudget : function() {
			return {
				budget:data.budget,
				totalInc:data.totals.inc,
				totalExp:data.totals.exp,
				percentage:data.percentage
			}
		},

		calculatePercentages : function() {
			data.allItems.exp.forEach(function(curr) {
				curr.calcPercentage(data.totals.inc);
			});		
		},

		getPercentages : function() {
			var allPerc = data.allItems.exp.map(function(curr) {
				return curr.getPercentage();
			});
			return allPerc;
		},

		// Setting data into local storage
	    storeData: function () {
	      localStorage.setItem("data", JSON.stringify(data));
	    },

	    // Getting data from local storage
	    getStoredData: function () {
	      var localData = JSON.parse(localStorage.getItem("data"));
	      return localData;
	    },

	    // Updating data structure from stored data
	    updateData: function (storedData) {
	      data.totals = storedData.totals;
	      data.budget = storedData.budget;
	      data.percentage = storedData.percentage;
	    },

		testFunc : function() {
			console.log(data);
		}
	}

})();

var UIController = (function() {

	var DOMstrings = {
		inputType:'.add__type',
		inputDesc:'.add__description',
		inputVal:'.add__value',
		inputBtn:'.add__btn',
		incomeContainer:'.income__list',
		expensesContainer:'.expenses__list',
		budgetLabel:'.budget__value',
		incomeLabel:'.budget__income--value',
		expensesLabel:'.budget__expenses--value',
		percentageLabel:'.budget__expenses--percentage',
		outerContainer:'.container',
		expPercentLbl:'.item__percentage',
		dateLabel:'.budget__title--month',
	};

	var numFormat = function(num,type) {
		// 1. Give the number 2 decimal places
		num = Math.abs(num); // ignore the sign if it was in the input
		num = num.toFixed(2);

		// 2. Add a comma as a thousand seperator
		numSplit = num.split('.');
		int = numSplit[0];
		dec = numSplit[1];

		if (int.length > 3) {
			int = int.substr(0,int.length-3) + ',' + int.substr(int.length-3,3);
		}

		// 3. Add a plus or minus sign to indicate income or expense
		return (type==='inc' ?'+':'-') + ' ' + int + '.' + dec;

	};

	var nodeListForEach = function(list,callBackFunc) {
				for (var i =0;i<list.length;i++) {
					callBackFunc(list[i],i);
				}
			};

	return {
		getInput  : function() {
			return {
				inputType : document.querySelector(DOMstrings.inputType).value,// either inc or exp
				inputDesc : document.querySelector(DOMstrings.inputDesc).value,
				inputVal : parseFloat(document.querySelector(DOMstrings.inputVal).value)
			};
		},
		addListItem : function(obj,type) {
			var html, newhtml, element
			// Create HTML placeholder
			if (type=='inc') {
				element = DOMstrings.incomeContainer;
				html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"> <div class="item__value">%value%</div><div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			} else if (type=='exp') {
				element = DOMstrings.expensesContainer;
				html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			}
			// Replace placeholder with actual data

			newhtml = html.replace('%id%',obj.id);
			newhtml = newhtml.replace('%description%',obj.description);
			newhtml = newhtml.replace('%value%',numFormat(obj.value,type));

			// Insert the HTML into the DOM
			document.querySelector(element).insertAdjacentHTML('beforeend',newhtml);

		},
		deleteListItem : function(selectorID) {
			var el;
			el = document.getElementById(selectorID);
			el.parentNode.removeChild(el); 
		},
		clearFields : function() {
			var fields, fieldsArr;

			fields = document.querySelectorAll(DOMstrings.inputDesc+','+DOMstrings.inputVal);
			fieldsArr = Array.prototype.slice.call(fields);

			fieldsArr.forEach(function(curr,index,array) {
				curr.value = '';
			});

			fieldsArr[0].focus();

		},
		displayBudget : function(obj) {
			if (obj.budget > 0) {
				type = 'inc';
			} else {
				type = 'exp';
			}

			document.querySelector(DOMstrings.budgetLabel).textContent = numFormat(obj.budget,type);
			document.querySelector(DOMstrings.incomeLabel).textContent = numFormat(obj.totalInc,'inc');
			document.querySelector(DOMstrings.expensesLabel).textContent = numFormat(obj.totalExp,'exp');
			if(obj.percentage>0) {
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage+'%';
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '--';
			}

		},
		displayPercentages : function(percentagesArr) {
			var fields = document.querySelectorAll(DOMstrings.expPercentLbl);

			nodeListForEach(fields,function(curr,index) {
				if (percentagesArr[index]>0) {
					curr.textContent = percentagesArr[index]+' %';
				} else {
					curr.textContent = '--';
				}
			});


		},
		getCurrYear : function() {
			var now, year, month, months;

			now = new Date();
			year = now.getFullYear();
			months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			month = now.getMonth();

			document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
		},
		changeType : function() {
			var fields = document.querySelectorAll(
					DOMstrings.inputType+','+
					DOMstrings.inputDesc+','+
					DOMstrings.inputVal
				);

			nodeListForEach(fields,function(curr) {
				curr.classList.toggle('red-focus');
			});

			document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
		},
		getDOMstrings : function() {
			return DOMstrings;
		}
	}


})();

var controller = (function(budgetCtrl,UIctrl) {


	var setupEventListeners = function() {
		var DOM = UIctrl.getDOMstrings();
		
		document.querySelector(DOM.inputBtn).addEventListener('click',ctlAddItem);

		document.addEventListener('keypress',function(event) {
			if (event.keycode===13||event.which===13) {
				ctlAddItem();
			}
		})

		document.querySelector(DOM.outerContainer).addEventListener('click',ctlDelItem);

		document.querySelector(DOM.inputType).addEventListener('change',UIctrl.changeType);
	}

	var loadData = function () {
	    // 1. Loca data from local storage
	    var storedData = budgetCtrl.getStoredData();

	    if (storedData) {
			// 2. insert the saved data into local storage
			budgetCtrl.updateData(storedData);

			// 3. create income items
			storedData.allItems.inc.forEach(function (cur) {
				var newIncItem = budgetCtrl.addItem("inc", cur.description, cur.value);
				UIctrl.addListItem(newIncItem, "inc");
			});

			// 4. Creating  expense items
			storedData.allItems.exp.forEach(function (cur) {
				var newExpItem = budgetCtrl.addItem("exp", cur.description, cur.value);
				UIctrl.addListItem(newExpItem, "exp");
			});

			// 5. Display the budget
			budget = budgetCtrl.getBudget();
			UIctrl.displayBudget(budget);

			// Display the percentage
			updatePercentages();
		}
	};

	var updateBudget = function() {
		// 1. Calculate the budget
		budgetCtrl.calcBudget();

		// 2. Return the budget
		var budget = budgetCtrl.getBudget();

		// 3. Display the budget on the UI
		UIctrl.displayBudget(budget);
	};

	var updatePercentages = function() {
		// 1. Calculate the %ages
		budgetController.calculatePercentages();

		// 2. Read the %ages from the budget controller
		var percentages = budgetController.getPercentages();

		// 3. Update the UI with the new %ages 
		console.log(percentages);
		UIctrl.displayPercentages(percentages);
	}

	var ctlAddItem = function () {
		// 1. Get the input field data
		inputData = UIctrl.getInput();
		

			if (inputData.inputDesc!=='' && !isNaN(inputData.inputVal) && inputData.inputVal>0) {
				// 2. Add the item to the budget controller
				newItem = new budgetController.addItem(inputData.inputType,inputData.inputDesc,inputData.inputVal);
	
				// 3. Add the item to the UI
				UIctrl.addListItem(newItem,inputData.inputType);
	
				// 4. Clear the fields
				UIctrl.clearFields();
	
				// 5. Calculate and Update Budget
				updateBudget();

				// 6. Calculate and updates %ages
				updatePercentages();

				// 7. Save to local storage
				budgetCtrl.storeData();
		}
	}

	var ctlDelItem = function(event) {
		var itemID, splitID, type, id;

		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
		if (itemID) {
			splitID = itemID.split('-');//inc-0
			type = splitID[0];
			ID = parseInt(splitID[1]);

			//1. delete the item from the data structure
			budgetCtrl.deleteItem(type,ID);

			//2. delete the item from the UI
			UIctrl.deleteListItem(itemID);

			//3. update and show the new budget
			updateBudget();

			// 4.Calculate and updates %ages
			updatePercentages();

			// 5. Save to local storage
			budgetCtrl.storeData();
		}
	}

	return {
		init : function() {
			console.log('The App has initiated');
			UIctrl.getCurrYear();
			UIctrl.displayBudget({
				budget:0,
				totalInc:0,
				totalExp:0,
				percentage:-1
			});
			setupEventListeners();
			loadData();
		}
	}


})(budgetController,UIController);


controller.init();