'use strict';

/* Directives */
angular.module('myApp.directives', [])

//Fa il logout e redirige alla pagina di login
.directive('logout',function(Auth,$ionicPopup,$timeout, $state){
	return {
		restrict: 'A',
		link: function(scope, element, attr){
				
				element.on('click', function(){
					var popup = $ionicPopup.show({
	    							template: '',
	    							title: 'Logout effettuato con successo',
	  							});
	  				$timeout(function() {
	     				popup.close(); //close the popup after 3 seconds for some reason
	  				}, 2000);	
	  				Auth.logout();
	  				
				})
			}
	}
})

/**
 * Crea una riga della lista dei multi impianti
 * @param {string=} data I dati estratti dal sommario presi dal server del singolo impianto
 * @param {string=} filter Un filtro definito nel template
 * @param {string=} setAll true per settare l'acquisto di un impianto: utile per comprare tutti gli impianti
 * @param {string=} setAllAction Un valore che cambia per fare aggiornare il valore di setAll: necessario per settare tutti gli impianti
 * @param {string=} buttonsOn true per schiacciare il bottone senza eseguire l'ordine
 * @param {string=} disableButton true per disabilitare il bottone
 * @param {string=} numberOfOrders Il numero di ordini dell'utente; serve per aggiungere l'ordine di attivazione quando viene fatto un ordine
 * @param {string=} resetSetBoxAll una callback per deselezionare il checkbox che acquista tutti gli impianti
 *     {method: estimated | expected | project o nuovi, altMethod: ..., show: ...}
 */
.directive('newRow', function(Settings, Auth, SUBSCRIPTION, $rootScope) {
	return {
		scope: {
			data: '=',
			orders: '=',
			setAll: '=',
			setAllAction: '=',
			buttonsOn: '=',
			disableButton: '=',
			numberOfOrders: '=',
			resetSetBoxAll: '&reset'
		},
		templateUrl: 'partials/multi-row.html',
		controller: function($scope) {
			$scope.nome_operatore = ($scope.data.nome_operatore + ' ' + $scope.data.ragione_sociale_operatore).trim();			

			//$scope.oldOrder = $scope.orders[$scope.data.id];			

			// evidenzio se l'abbonamento e' in scadenza
			//$scope.toRenew = $scope.oldOrder != undefined && $scope.oldOrder.warning_expire != undefined ? $scope.oldOrder.warning_expire : false;
			
			//$scope.expired =  $scope.oldOrder != undefined && $scope.oldOrder.subscription_days_to_expiry != undefined && $scope.oldOrder.subscription_days_to_expiry < 0 && $scope.oldOrder.subscription_days_to_expiry > -Math.abs(SUBSCRIPTION.DAYS_SHOW_EXPIRED) ? true : false;
			
			// Disabilito il bottone in cui c'e' l'ordine in attesa del pagamento
			if ($scope.disableButton != undefined && $scope.disableButton[$scope.data.id] !== undefined && $scope.disableButton[$scope.data.id])
				$scope.ordered = true;
			else
				$scope.ordered = false;
			
			var user = Auth.getUser();
		
			// Setto i bottoni indicati in ButtonsOn (posizione di partenza)
			//if ($scope.buttonsOn[$scope.data.id] !== undefined) {
			//	$scope.data.settato = true;
			//}		

			var fromAll = false;
							
			// La configurazione e' quella indicata in data.settings, ma se questa e'
			// vuota o gli mancano dei metodi uso quella di default.
			// Questo metodo fa questo e aggiunge delle funzioni necessarie
			//console.log($scope.data.settings);
			$scope.config = Settings.getSettings($scope.data.settings).plantsListRow;
			
			//console.log($scope.config);
			
			$scope.premium = $scope.config.premium !== undefined ? $scope.config.premium : false;
			
			if ($scope.data.settato !== true && $scope.premium == false) {
				$scope.resetSetBoxAll();
			}
			
			$scope.$watchCollection('setAllAction', function(newValue, oldValue) {
				if ($scope.setAll !== undefined && !$scope.premium) {
					fromAll = true;
					$scope.order($scope.setAll);
				}
			});
			
			// Gestione pulsante ordine	
/*			$scope.order = function(set, manual) {
				if (set === undefined)
					$scope.data.settato = !$scope.data.settato;
				else
					$scope.data.settato = set;
				
				// Se la richesta e' fatta dal pulsante setto fromAll a false altrimenti non salva il carrello
				if (manual)
					fromAll = false;
				
				var orderId;
				if ($scope.data.settato) {
					var aItem = CartSun.createSingoloImpiantoProduct($scope.data, $scope.data.product.id);
					if (aItem != undefined) {
						CartSun.addItem(aItem, 1);
						//CartSun.addFirstActivationOrder($scope.numberOfOrders);
					} else
						console.log("Nessun prodotto: ricaricare la pagina, forse e' stata cambiato il customer group dell' utente");
				}
				if (!$scope.data.settato) {
					aItem = CartSun.createSingoloImpiantoProduct($scope.data, $scope.data.product.id);
					if (aItem != undefined) {
						orderId = CartSun.removePlant(CartSun.searchItem(aItem, 1));
						$scope.resetSetBoxAll(); // resetto il checkbox che seleziona tutti gli impianti
					} else
						console.log("Nessun prodotto: ricaricare la pagina, forse e' stata cambiato il customer group dell' utente");
				}

				// Salvo il carrello sul server, ma non lo faccio se c'e' un ordine di tutti in una volta: lo
				// fara' solo l'ultima di queste righe, per evitare di fare un salvataggio per ogni riga
				if (!fromAll || ($scope.$parent.$last && fromAll))
					CartSun.save(user.id);
			}*/
			
			$scope.month = $scope.data.energy_last_month;
			$scope.year = $scope.data.energy_last_year;	
			
			// se definita applico la funzione che calcola il metodo
			if ($scope.config.methodCalc !== undefined) {
				var method = $scope.config.methodCalc($scope.config.method, $scope.config.altMethod, $scope.data.radiations_station_distance);
			} else
				var method = $scope.config.method;
			
				
			// Determino la visualizzazione secondo le impostazioni
			// Link alla visualizzazione singola dell'impianto
			// VEDI NEL TEMPLATE L'UTILIZZO DELLE PROPRIETA' DI CONFIG NEI ng-show
			
			// determina se considerare i valori stimati con la radiazione reale o quelli previsti da enea
			$scope.showEstimated = false;
			if (method == 'estimated') {
				var energyCalculatedMonth = $scope.month.estimated;
				var energyCalculatedYear = 	$scope.year.estimated;
				// calcolo del rendimento
				$scope.rendimento = $scope.data.efficiency_last_year.estimated;				
				$scope.showEstimated = true;
			} else if (method == 'expected') {
				var energyCalculatedMonth = $scope.month.expected;
				var energyCalculatedYear = 	$scope.year.expected;
				$scope.rendimento = $scope.data.efficiency_last_year.expected;				
			} else {
				var energyCalculatedMonth = $scope.month.project;
				var energyCalculatedYear = 	$scope.year.project;
				// con i valori di progetto il rendimento non ha senso
			}
			
			var getStyle = function(value) {
				switch (value) {
					case 1:
						return 'text-ok';
						break;
					case 2:
						return 'text-ok';
						break;
					case 3:
						return 'text-warning';
						break;
					case 4:
						return 'text-alarm';
						break;
					default:
						return '';
				}
			}
			
			$scope.month.style = getStyle($scope.data.benchmark.energy.last_month.value);
			$scope.year.style = getStyle($scope.data.benchmark.energy.last_year.value);
			
			// ore equivalenti
			$scope.ore = $scope.data.energy_last_year.real / $scope.data.power;
			
			// barra energia
			/*
			var bar = {b1: $scope.rendimento, b2: 0};
			if ($scope.rendimento > 1) {
				bar.b1 = 1;
				bar.b2 = $scope.rendimento - 1;
			}
			$scope.barStyle = {"width": bar.b1 * 100 +"%"};
			$scope.year.bar = bar;			
			*/
		}
	}
})

//Chart produzione di energia
.directive('ttHomeChart', function(flotOptions, PlantData, Utility, dataNull) {
	return {
		scope: {
			energy: '=',
			anno: '=',
			config: '='
		},
		template: "<div class='chart' style='height: 300px; margin-bottom: 12px'></div><div class='labels padding'></div>",
		link: function(scope, elm, attrs, ctrl) {	
			var values2 = scope.energy;
			var stima = values2.estimated_gse_single;
			
			var options = angular.copy(flotOptions);
			
			// se c'e' la funzione per calcolare la condizione di visualizzazione delle stima la eseguo
			if (scope.config.estimatedCondition !== undefined) {
				var showEstimated = scope.config.estimatedCondition(scope.energy.info.radiations_station_distance);
			} else
				showEstimated = true;
			
			// determina se visualizzare o meno l'anno precedente
			var showLastYear = (scope.config.showLastYear !== undefined && scope.config.showLastYear == false) ? false : true;
			
			// Per la serie "stima gse" (la stima GSE) non voglio visualizzare la label. Setto allora qui il valore da mettere nel tooltip che non
			// puo' essere preso dalla label
			options.tooltipOpts = {
				content: function(label, xval, yval, flotItem) {
					var ret = "%y kWh";
					if (label == undefined)
						ret = ret + " (valore non ancora definitivo)";
					return ret;
				}
			};
			
			// se non c'e' nessun valore effettivo metto la label alle stime del gse
			if (values2.effectives[scope.anno] === undefined)
				var labelStima = scope.anno + ', stima';
				
			var data = [];
			
			for (var i=0; i< scope.config.show.length; i++) {
				var toShow = scope.config.show[i];
				if (toShow == 'project') {	
					data.push({data: values2.project[scope.anno], curvedLines: {apply: true}, hoverable: false, color:"#777"});
					// punti dei valori di progetto con le label
					data.push({label:"Budget", data: values2.project[scope.anno], points: {show: true}, color:"#777"}); // serie 1			
				}
				if (toShow == 'expected') {
				// curva dei valori previsti (calcolata con dati storici) senza label
					data.push({
						data: values2.expected[scope.anno], 
						curvedLines: {apply: true}, 
						hoverable: false, 
						color:"#ddd"
					});
					// punti dei valori valori con le label
					var labelExpected = "<strong>Previsione iniziale</strong> con la radiazione media storica"
					//var labelExpected = gettextCatalog.getString("<strong>Previsione iniziale</strong><i>con la radiazione<br/>media storica</i>");
					data.push({label: labelExpected, data: values2.expected[scope.anno], points: {show: true}, color:"#ddd"}); // serie 5
				}
				if (toShow == 'estimated' && showEstimated) {
					// curva dei valori stimati con i dati reali di radiazione (senza label)
					data.push({data: values2.estimated[scope.anno], curvedLines: {apply: true}, hoverable: false, color:"#66C590"});
					// punti dei valori stimati calcolati con i dati reali di radiazione (con label)

					var labelEstimated = "<strong>Stima corrente</strong> con la radiazione reale";
					//var labelEstimated = gettextCatalog.getString("<strong>Stima corrente</strong><i>con la radiazione<br/>reale</i>");
					data.push({label: labelEstimated, data: values2.estimated[scope.anno], points: {show: true}, color:"#66C590"}); // serie 6
				}
			}
			
			// barre della stima del gse quando non c'e' il valore effettivo, senza label
			data.push({
				label: labelStima,
				data: stima[scope.anno], // serie 2
				bars: {
					show: true, 
					barWidth:0.1, 
					align:"left", 
					fill: 0.2,
					lineWidth: 0
				},
				color: "#66C590"
			});
			// Barre del valore effettivo
			//var labelProduzione = gettextCatalog.getString('Produzione');
			var labelProduzione = "Produzione"
			data.push({label: '<strong>' + labelProduzione + ' ' + scope.anno + '</strong>', data: values2.effectives[scope.anno], bars:{show: true, barWidth:0.2, align:"left"}, color:"#44b476" }); //serie 3			


			// barre delle misure effettive dell'anno precedente
			if (showLastYear) {
				if (values2.effectives[scope.anno - 1] != undefined) {
					data.push({label: '<strong>' + labelProduzione + ' ' + (scope.anno - 1) + '</strong>', data: values2.effectives[scope.anno - 1], bars:{show:true, barWidth:0.2, align:"right"}, color: "black"});
				}
			}
			
			// Una serie con valori nulli in modo da avere sempre i 12 mesi
			data.push({data: dataNull, points: {show: true}, color:"transparent", shadowSize: 0});

			options.legend.container = $(elm[0]).children()[1];
			$.plot($(elm[0]).children()[0], data, options);
			
		}
	}
})	

/* Un widget con il totale del ricavo per incentivi */
.directive('widgetRevenue', function(Revenues, $filter, PlantData) {
	return {
		scope: {
			data: '='
		},
		transclude : true,
		templateUrl: 'partials/panel-widget.tpl.html',
		controller: function($scope) {
			$scope.descrizione = "Il ricavo totale per incentivi dall'avvio dell'impianto";
			//$scope.descrizione = gettextCatalog.getString("Il ricavo totale per incentivi dall'avvio dell'impianto");
			$scope.icon = "icon ion-arrow-graph-up-right";
			$scope.bgClass = "bg-success";
			$scope.row1 = $filter('currency')(Revenues.total(PlantData.getIncentiviList($scope.data)),"€");
			//$scope.row2 = gettextCatalog.getString("Ricavi per incentivo");
			$scope.row2 ="Ricavi per incentivo";

		}	
		
	}
})

/* Un widget con il totale dell'energia prodotta */
.directive('widgetEnergyYear', function(PlantData, Utility) {
	return {
		scope: {
			energy: '='
		},
		transclude : true,
		templateUrl: 'partials/panel-widget.tpl.html',
		controller: function($scope) {
			var value = $scope.energy.last_year.real;
			$scope.descrizione = "L'energia prodotta dall'impianto negli ultimi 12 mesi";			
			//$scope.descrizione = gettextCatalog.getString("L'energia prodotta dall'impianto negli ultimi 12 mesi");
			$scope.icon = "icon ion-flash";
			$scope.bgClass = "bg-warning";
			if (value !== null) {
				$scope.row1 = Math.round(value) + ' kWh';
				//$scope.row2 = gettextCatalog.getString("Energia prodotta negli ultimi 12 mesi");
				$scope.row2 = "Energia prodotta negli ultimi 12 mesi";

			} else {
				$scope.error = true;
				//$scope.errorText = gettextCatalog.getString("Non è stato possibile calcolare l'energia degli ultimi 12 mesi: potrebbe mancare la misura di uno o più mesi");
				$scope.errorText = "Non è stato possibile calcolare l'energia degli ultimi 12 mesi: potrebbe mancare la misura di uno o più mesi";
			}

			$scope.rendimento = $scope.energy.efficiency_last_year.estimated;	

			// barra energia
			var bar = {b1: $scope.rendimento, b2: 0};
			if ($scope.rendimento > 1) {
				bar.b1 = 1;
				bar.b2 = $scope.rendimento - 1;
			}
			$scope.energy.barStyle = {"width": bar.b1 * 100 +"%"};
			//$scope.year.bar = bar;			
		}	
		
	}
})

/**
 * Una pie chart con la produzione dell'ultimo mese
 * @param {string=} energy I dati delle'energia dell'impianto presi dal server con la query plants/is?energy
 * @param {string=} config La configurazione del tipo 
 *     {method: estimated | expected | project o nuovi, altMethod: ..., methodCalc; function..., show: ...}
 */
.directive('chartEnergyMonth', function(PlantData, Utility) {
	return {
		scope: {
			energy: '=',
			config: '='
		},
		templateUrl: 'partials/panel-chart.tpl.html',
		controller: function($scope) {
			$scope.hasHeader = true;
			$scope.title = "Produzione ultimo mese";
			var state;
			var check = {text: "CHECK", text2: "Ultimo mese misurato da verificare", style: "text-warning"};
			var alarm = {text:"NO", text2: "Ultimo mese misurato non regolare!", style: "text-alarm"};
			var ok = {text: "OK", text2: "Ultimo mese misurato perfetto", style:"text-ok"};				
			var getState = function(value) {
				switch (value) {
					case 1:
						return ok;
						break;
					case 2:
						return ok;
						break;
					case 3:
						return check;
						break;
					case 4:
						return alarm;
						break;
					default:
						return null;
				}
			}
			state = getState($scope.energy.benchmark.energy.last_month.value);
			
			$scope.descrizione = "L'energia prodotta realmente dall'impianto nell'ultimo mese misurato rispetto a quanto previsto";
			$scope.row1 = state;
			if (state != undefined) {
				$scope.row2 = state.text2;			
				var difference = $scope.energy.benchmark.energy.last_month.deviation;			
				$scope.percent = {};		
				$scope.percent.value = Math.round(100 + difference * 100);
				if ($scope.percent.value > 100) 
					$scope.percent.text = '+' + ($scope.percent.value - 100) + "%";
				else
					$scope.percent.text = ($scope.percent.value - 100) +"%";
			    $scope.options = {
			        animate:{
			            duration:1000,
			            enabled:true
			        },
			        barColor:'#70da8d',
			        trackColor: "rgb(130, 130, 130)",
			        scaleColor: false,
			        lineWidth:8,
			        lineCap:'round',
			        size:120
			    };
			} else {
				$scope.row2 = "Dato non ancora disponibile";

			}
		}	
	}
})

/* Una pie chart con la produzione dell'ultimo anno */
.directive('chartEnergyYear', function(PlantData, Utility) {
	return {
		scope: {
			energy: '=',
			config: '='
		},
		templateUrl: 'partials/panel-chart.tpl.html',
		controller: function($scope) {
			$scope.hasHeader = true;
			$scope.title = "Produzione ultimo anno";

			// se definita applico la funzione che mi calcola il metodo
			if ($scope.config.methodCalc !== undefined) {
				var method = $scope.config.methodCalc($scope.config.method, $scope.config.altMethod, $scope.energy.info.radiations_station_distance);
			} else
				var method = $scope.config.method			
			var state;
			var check = {text: "CHECK", text2: "Periodo ultimi 12 mesi da verificare", style: "text-warning"};
			var alarm = {text:"NO", text2: "Periodo ultimi 12 mesi non regolari!", style: "text-alarm"};
			var ok = {text: "OK", text2: "Periodo ultimi 12 mesi come previsto o meglio", style:"text-ok"};
			
			var misura = $scope.energy.last_year.real;
			var riferimento = $scope.energy.last_year[method];
			
			if (riferimento !== null && misura !== null) {
				var difference = $scope.energy.benchmark.energy.last_year.deviation;

				var getState = function(value) {
					switch (value) {
						case 1:
							return ok;
							break;
						case 2:
							return ok;
							break;
						case 3:
							return check;
							break;
						case 4:
							return alarm;
							break;
						default:
							return null;
					}
				}
				state = getState($scope.energy.benchmark.energy.last_year.value);				
				
				$scope.descrizione = "L'energia totale prodotta dall'impianto negli ultimi dodici mesi rispetto al previsto."
				$scope.row1 = state;
				$scope.row2 = state.text2;	
				$scope.percent = {};		
				$scope.percent.value = Math.round(100 + difference * 100);
				if ($scope.percent.value > 100) 
					$scope.percent.text = '+' + ($scope.percent.value - 100) + "%";
				else
					$scope.percent.text = ($scope.percent.value - 100) + "%";
			} else {
				$scope.error = true;
				$scope.errorText = "Non è stato possibile verificare gli ultimi 12 mesi: potrebbe mancare la misura di uno o più mesi";
			}
		    
			
			$scope.options = {
		        animate:{
		            duration:1000,
		            enabled:true
		        },
		        barColor:'#70da8d',
		        trackColor: "rgb(130, 130, 130)",
		        scaleColor: false,
		        lineWidth:8,
		        lineCap:'round',
		        size:120
		    };
		}	
	}
})


//la search bar nella homepage
.directive("search",function($filter,$document){
	return{
		restrict: 'E',
		replace: true,
		transclude: 'element',
		templateUrl : "partials/searchbar.html",
		link : function(scope, element, attrs, transclude){

			var ionicHeaderBar = angular.element(element.parent());
			var searchBar = angular.element(element.children()[0]);
			var openButton= angular.element(element.children()[1]);
			var closeButton = angular.element(searchBar.children()[0]);

			//inserisco il bottone nella barra header
			ionicHeaderBar.append(openButton);
			
			//appendo la barra della ricerca dopo la barra header
			ionicHeaderBar.after(searchBar);
			
			//rimuovo l'elemento root del template dal DOM, altrimenti se viene inserito all'interno della barra header si sballa il layout dei bottoni (cosa gestita da Ionic)
			element.remove();

			openButton.on("click", function(){
				scope.showSearchBar = true;
			});

			closeButton.on("click", function(){
				scope.showSearchBar = false;
			});

		}
	}
})

.directive('yearChange', function(){
	return{
		link: function(scope, elm, attrs, ctrl){
			var years = scope.years;
			scope.yearS = years[1];
		}
	}
})

// La tabella della produzione di energia
.directive('energyTable', function($filter, PlantData, Utility) {
	return {
		scope: {
			energy: '=',
			yearSelected: '=',
			config: '='
		},
		templateUrl: 'partials/energy-table.tpl.html',
		link: function(scope, elm, attrs, ctrl) {
		
		},
		controller: function($scope) {

			var serie = $scope.energy.all;
			
			$scope.compare = $scope.config.show !== undefined && $scope.config.show == 'compare' ? true : false;
			
			// se definita applico la funzione che mi calcola il metodo
			if ($scope.config.methodCalc !== undefined) {
				var method = $scope.config.methodCalc($scope.config.method, $scope.config.altMethod, $scope.energy.info.radiations_station_distance);
			} else
				var method = $scope.config.method
			
			// Il nome della colonna
			if (method == "project")
				$scope.refName= "Budget";
				//$scope.refName = gettextCatalog.getString("Budget");
			if (method == "expected")
				$scope.refName= "Previsto";
				//$scope.refName = gettextCatalog.getString("Previsto");
			if (method == "estimated")
				$scope.refName= "Atteso";
				//$scope.refName = gettextCatalog.getString("Atteso");
				
			function setValues2() {
				if ($scope.yearSelected == undefined) return;
				// values conterra' un array del tipo [{mese: 10, effective: v, estimated_gse: v...}, ... ]
				// qui tutti i valori dell'anno
				var values = serie[$scope.yearSelected];
				
				// calcolo i totali (TODO purtroppo itero, non ho trovato altra via
				// chiamando una funzione da ng-repeat viene chiamata piu' volte)
				var tReale = 0, tRiferimento = 0;
				for (var i=0; i < values.length; i++) {
					tReale += values[i].real_flagged.valore;
					tRiferimento += values[i][method];
				}
				$scope.tScostamento = (tReale - tRiferimento) / tRiferimento;
				$scope.tReale = tReale;
				$scope.tRiferimento = tRiferimento;
				// Setto i valori dell'anno
				$scope.values = values;
			}	
			
			setValues2();
			
			$scope.$watch('yearSelected', function() {
				setValues2();
			});
			
			$scope.years = Object.keys(serie).reverse();

			//fa vomitare ma funzia
			$scope.getMonthName = function(month) {

				switch (month){
					case "1":
						return "Gennaio";
						break;
					case "2":
						return "Febbraio";
						break;
					case "3": 
						return "Marzo";
						break;
					case "4": 
						return "Aprile";
						break;
					case "5": 
						return "Maggio";
						break;
					case "6": 
						return "Giugno";
						break;
					case "7": 
						return "Luglio";
						break;
					case "8": 
						return "Agosto";
						break;	
					case "9": 
						return "Settembre";
						break;
					case "10": 
						return "Ottobre";
						break;
					case "11": 
						return "Novembre";
						break;
					case "12": 
						return "Dicembre";
						break;
				}
			};
			
			// fornisce alla tabella il valore di confronto
			// puo' essere project, expected o estimated: dipende dalla proprieta' determinata dal config
			$scope.getReference = function(index) {
				return $scope.values[index][method];
			};
			
			$scope.scostamento = function(index) {
				// $scope.values contiene i valori dell'anno selezionato grazie alla funzione setValues()
				var value = $scope.values[index];
				if (value == undefined) return;
				var real = Math.round(value.real_flagged.valore);
				var reference = Math.round(value[method]);
				return $filter('percentage2')((real - reference)/reference);
			};		
		
		}
	}
})

