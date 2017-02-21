'use strict';

/* Services */

angular.module('myApp.services', [])
// versione dell'applicazione
	.value('version', '0.1')
	.value('MAX_DISTANCE_STATION', 10000) // La distanza massima entro la quale dare dati meteo
/*	
	.constant('ACTIVE_LIST_PRODUCT', 3)
	.constant('ACTIVE_PLANT_FOR_LIST_PRODUCT', 4)
	.constant('PREMIUM_PLANT_PRODUCT', 2)
	.constant('FREE_PLANT_PRODUCT', 1)
*/	
	// TODO sarebbe meglio leggere le costanti dal server
	.constant('COUPONS_PRODUCT_CATEGORY_ID', 4)
	.constant('PLANTS_PRODUCT_CATEGORY_IDS', [1, 2])
	
	.constant('LANGUAGE_DEFAULT', 'it')
	
	// Il periodo in giorni massimo di sconti e commisisoni oltre al quale viene visualizzato
	// un errore nella lista dei coupon
	.constant('DISCOUNT_MAX_PERIOD', 300)
	.constant('COMMISSION_MAX_PERIOD', 365)

	.constant('SUBSCRIPTION', {
		'DAYS_TO_EXPIRY': 45,
		'DAYS_TOO_OLD': 120,
		'DAYS_SHOW_EXPIRED' : 30
	})
	
	.constant('BENCHMARK', {
		'ENERGY_VERYGOOD': 1,
		'ENERGY_GOOD': 2,
		'ENERGY_BAD': 3,
		'ENERGY_VERYBAD': 4
	})
	
	.constant('ORDERS', {
		'DAYS_OLD': 545
	})
	
	// tipo di prodotti per id
	.constant('PRODUCT', {
		'ACTIVE_LIST': 3, // Il prodotto che attiva la lista degli impianti, e' la piattaforma
		'ACTIVE_PLANT_FOR_LIST_CATEGORY': 1,
		'ACTIVE_PLANT_CATEGORY': 2,
		'PREMIUM_PLANT': 2,
		'FREE_PLANT': 1
	})
	
	.constant('LOGIN_PATH', "login")
	
		// Il tipo di utente	
	.constant('USER_TYPE', {
		'ADMIN': 1,
		'CUSTOMER': 2,
		'AGENT': 3
	})

	// Opzioni e valori per il plugin grafici
	.value('flotOptions', {
		series: {
			curvedLines: {
				active: true
			}
		},
		tooltip: true,
		grid: {
			hoverable: true
		},
		legend: {
			show: true,
			noColumns : 2 
		},
		xaxis: {
			//mode: "categories",
			ticks: [[1, "Gen"],[2, "Feb"],[3, "Mar"],[4, "Apr"],[5, "Mag"],[6, "Giu"],[7, "Lug"],[8, "Ago"],[9, "Set"],[10, "Ott"],[11, "Nov"],[12, "Dic"] ]
		}
	})

	// Una serie di valori null che serve per avere sempre i 12 mesi nei grafici
	.value('dataNull', [[1, null], [2, null], [3, null], [4, null], [5, null], [6, null], [7, null], [8, null], [9, null], [10, null], [11, null], [12, null]])



	.config(function ($httpProvider) {
		//$httpProvider.defaults.withCredentials = true;
  		$httpProvider.defaults.headers.common = {};
  		$httpProvider.defaults.headers.post = {};
  		$httpProvider.defaults.headers.put = {};
  		$httpProvider.defaults.headers.patch = {};
})
	/**
	* Provvede a eseguire il login, logout e a conservare lo stato dell'utente
	*/
	.service('Auth', function($q, CurrentUser, Login, $location, Logout, $rootScope, USER_TYPE) {
		
		var user;
		var logged;
		var loginPath = 'login';
		
		this.getUser = function() {
			return (user === undefined) ? null : user;
		};
		
		this.isLogged = function() {
			return logged;
		};
		
		function setRootUserName(set) {

			if (set !== false)
				$rootScope.userName = user.name + ' ' + user.surname;
			else
				$rootScope.userName = undefined;
			
			// Setto anche l'utente attivo
			$rootScope.userActive = (user != undefined && user.active != undefined) ? true: false;

			// Setto i tipi di utente
			$rootScope.userCustomer = (user != undefined && user.type == USER_TYPE.CUSTOMER) ? true : false;
			$rootScope.userAgent = (user != undefined && user.type == USER_TYPE.AGENT) ? true : false;
			$rootScope.userAdmin = (user != undefined && user.type == USER_TYPE.ADMIN) ? true : false;
			
			// Setto la lingua
			/*
			if (user !== undefined) {
				var language = user.language !== undefined ? user.language : 'it';
				gettextCatalog.setCurrentLanguage(language);
			}
			*/
		}
		
		// Carico l'utente e faccio le cose da fare appena caricato
		function loadUser(force) {
			var d = $q.defer();
			if (user === undefined || force) {
				CurrentUser.getUnsafe(function(currentUser) {
					// Se ha preso l'utente allora e' loggato
					logged = true;
					user = currentUser;
					setRootUserName();
					d.resolve();
				},
				function() {
					// Non sono loggato, cancello tutto
					reset();
					d.resolve();
				});
			} else {
				d.resolve();
			}
				
			return d.promise;
		};
		
		this.loadUser = function(force) {
			return loadUser(force);
		};
		
		this.login = function(userid, password, type) {
			var d = $q.defer();
			Login.save(null, {userid: userid, password: password, type: type}, function(theUser) {
				logged = true;
				//user = undefined;
				//var p = loadUser();

				user = theUser;
				setRootUserName();
				d.resolve(theUser);
				/*
				p.then(function() {
					d.resolve(theUser)
				});
				*/
			},
			function() {
				d.resolve(null)
			});
			
			return d.promise;
		};
		
		function reset() {
			logged = false;
			user = undefined;
			setRootUserName(false);			
		}
		
		this.clear = function() {
			reset();
		};
		
		function logout(path) {
			// if (path == undefined)
			// 	path = LOGIN_PATH;
			reset();
			console.log("logged out");
			Logout.simple(function() {
				//$location.path(path)
			});
		};
		
		this.logout = function(path) {
			logout(path);
		};
	
	})
	
	// Oggetto che conserva lo stato della registrazione
	.service('SignupData', function() {
		var userid, step;
		this.setUserid = function(userid) {
			this.userid = userid;
		}
		
		this.setWizardStep = function(step) {
			this.step = step;
		}
		
		this.getUserid = function() {
			return this.userid;
		}
		
		this.getWizardStep = function() {
			return this.step;
		}
	})
	
	// Prende dal server i dati che servono e li salva nei metodi.
	// Essendo un oggetto singleton lo fa una sola volta.
	// Le variabile settate vengono svuotate dal metodo clear (chiamato dal logout)
	// TODO trova un metodo migliore per svuotare tutto al logout
	// TODO trova un metodo per ricaricare periodicamente tutto (se l'utente tiene la sessione aperta per molto
	// tempo potrebbe perdere degli aggiornamenti)
	.service('ReportData', function(Plants, Products, $q, $location, $rootScope, Auth) {
		
		var plantsNumber, plantsOperatorList, plantsSummaryList, currentPlant, currentPlantEnergy, products, totalOrders, incoming = {}, hasSsp;
		
		// carica la lista del sommario degli impianti e se c'e' un solo impianto carica anche lui
		// Tipicamente chiamato dal metodo resolve di routeProvider (vedi app.js)
		this.loadFirst = function() {
			var d = $q.defer();
			// Auth.loadUser() viene chiamato da $route prima di ogni pagina, ma anche questo servizio viene chiamato.
			// Non abbiamo nessuna garanzia che Auth venga chiamato prima, allora ricarico Auth qui. Auth.loadUser() e' intelligente
			// e se il valore di user ce l'ha gia' non lo richiama dal server
			var currentP = Auth.loadUser();
			currentP.then(function() {	
				if (!Auth.isLogged()) {
					d.reject();
					$location.path('/login');
				} else {
					// sono loggato, faccio tutto
					// setto il numero di impianti: mi servira' per decidere cosa fare
					var p = setPlantsNumber();
					p.then(function() {
						// leggo la lista, mi serve anche per prendere l'id dell'unico impianto
						var pl = loadPlantsList();
						pl.then(function() {
							console.log("Caricata lista impianti");
							if (plantsNumber == 1) { // settato da setPlantsNumber()
								var plantId = plantsSummaryList[0].id; // settata da loadPlantsList()
								Plants.get({id: plantId}, function(aPlant) {
									currentPlant = aPlant;
									d.resolve();
								});
							} else
								d.resolve();
						});
					});
				}
			});
			return d.promise;
		};
							
		// Carica la lista degli impianti se e' vuota
		function loadPlantsList () {
			var d = $q.defer();
			if (plantsSummaryList == undefined) {
				Plants.summaryList(function(list) {
					plantsSummaryList = list;
					d.resolve();
				});
			} else
				d.resolve();
			return d.promise;
		};

		// carica un impianto e la sua energia
		this.loadCurrentPlantAndEnergy = function(id, force) {
			var d = $q.defer();
			this.loadCurrentPlant(id, force).then(function() {
				loadCurrentPlantEnergy(id, force).then(function() {
					console.log("Caricato impianto singolo")
					d.resolve();
				});
			});
			return d.promise;
		};
			

		// carica un impianto se non c'e' o se l'id e' diverso da quello che c'e'
		this.loadCurrentPlant = function(id, force) {
			
			// Controllo se ha dispositivi connessi
			// Va bene la richiesta asincrona: apre il menu quando true ed e' chiuso quando ancora undefined
			/*
			Plants.getDevices({id:id}, function(devices) {
				$rootScope.hasDevice = devices.length > 0 ? true : false;
			});
			*/

			var d = $q.defer();
			// prima chiedo comunque il numero di impianti
			var p = setPlantsNumber();
			p.then(function() {
				if (hasSsp === undefined || currentPlant === undefined || currentPlant.id != id || force === true) {
					Plants.get({id: id}, function(aPlant) {
						currentPlant = aPlant;
						d.resolve(); //questo andrà spostato qua sotto dopo che il test per l'ssp è stato fatto
						/*
						Plants.sspHas({id: id}, function(sspTest) {
							hasSsp = sspTest.result;
							
						});
						*/
					});
				} else
					d.resolve();
			});

			return d.promise;
		};
		
		
		/**
		 * Restituisce true se l'impianto ha i dati dello scambio sul posto
		 */
		this.getHasSsp = function() {
			return hasSsp;
		};
		
		/**
		 * Carica i prodotti e li mette in ordine per id
		 */
		this.loadProducts = function() {
			var d = $q.defer();
			if (products === undefined) {
				Products.query(null, function(theProducts) {
					var pList = {};
					for (var i = 0; i < theProducts.length; i++) {
						pList[theProducts[i].id] = theProducts[i];
					}					
					products = pList;
					d.resolve();
				});
			} else
				d.resolve();
			return d.promise;
		};
		
		this.loadIncoming = function(id) {
			var d = $q.defer();
			if (incoming === undefined || incoming.plantId != id) {
				Plants.incoming({id: id}, function(theIncoming) {
					incoming = theIncoming;
					incoming.plantId = id;
					d.resolve();
				});
			} else
				d.resolve();
			return d.promise;
		};
		
		this.getIncoming = function() {
			return incoming;
		}
		
		this.loadTotalOrders = function() {
			var d = $q.defer();
			// non ricarico l'utente, dovrebbe essere una chiamata abbinata sempre a una precedente
			if (totalOrders === undefined) {
				Orders.total(null, function(total) {
					totalOrders = total;
					d.resolve();
				});
			} else
				d.resolve();
			return d.promise;
		};
		
		// carica i valori di energia di un impianto se non ci sono o 
		// se l'id dell'impianto e' diverso da quello dell'impianto corrente
		function loadCurrentPlantEnergy(plantId, force) {
			var d = $q.defer();
			if (currentPlantEnergy === undefined || currentPlantEnergy.plantId != plantId || force === true) {
				Plants.energy({id: plantId}, function(aPlantEnergy) {
					currentPlantEnergy = aPlantEnergy;
					currentPlantEnergy.plantId = plantId;
					d.resolve();
				});
			} else
				d.resolve();
			return d.promise;
		};		
		
		// restituisce l'impianto corrente
		this.getCurrentPlant = function() {
			return currentPlant;
		};
		
		// restituisce l'energia dell'impianto corrente
		this.getCurrentPlantEnergy = function() {
			return currentPlantEnergy;
		}

		// restituisce i prodotti disponibili per l'utente
		this.getProducts = function() {
			return products;
		};
		
		// restituisce il numero di ordini totali dell'utente
		this.getTotalOrders = function() {
			return totalOrders;
		};
		
		// restituisce la lista dei dati essenziali degli impianti
		this.getPlantsSummaryList = function() {
			return plantsSummaryList;
		};
		
		this.clear = function() {
			console.log("Cleared Plants");
			plantsNumber = plantsOperatorList = plantsSummaryList = currentPlant = currentPlantEnergy = $rootScope.plantsNumber = plantsNumber = products = totalOrders = incoming = hasSsp = undefined;
		};
		
		this.clearEnergy = function() {
			currentPlantEnergy = undefined;
		};
		
		function setPlantsNumber() {
			var d = $q.defer();
			if (plantsNumber == undefined) {
				Plants.info(null, function(theInfo) {
					plantsNumber = theInfo.number;
					$rootScope.plantsNumber = plantsNumber;				
					d.resolve();
				});
			} else
				d.resolve();
				
			return d.promise;
		}
		
	})

	// Il percorso dei dati negli impianti e' lungo e puo' cambiare, meglio centralizzare
	// l'estrazione dei dati dall'oggetto. Questo servizio lo fa.
	.service('PlantData', function() {
		
		this.getIncentiviList = function(plant) {
			if (plant.incentivi === null)
				return null;
			return plant.incentivi.valori.valori;
		}
		
		this.getStatoImpianto = function(plant) {
			if (plant.info === null)
				return null;
			return plant.info.valori.stato_impianti[0];
		}
		
		this.getMisureList = function(plant) {
			if (plant.misure === null)
				return null;
			return plant.misure.valori.valori;
		}
		
		this.getStrutture = function(plant) {
			if (plant.info === null)
				return null;
			return plant.info.valori.struttura_supporto;
		}
		
		this.getConvertitori = function(plant) {
			if (plant.info === null)
				return null;
			return plant.info.valori.caratteristiche_convertitori;
		}
		
		this.getModuli = function(plant) {
			if (plant.info === null)
				return null;
			return plant.info.valori.caratteristiche_moduli;
		}				
	})	

	// Restituisce le impostazioni. Sono prese dal server
	// Il metodo load deve essere chiamato prima di potere chiamare getSettings
	.service('Settings', function(MAX_DISTANCE_STATION, $q, SettingsFromServer, $rootScope) {
		var settings;
		
		this.clear = function() {
			settings = undefined;
		};

		this.load = function() {
			var d = $q.defer();
			if (settings === undefined) {
				// TODO deve chiamare quelle dell'utente non tutti
				SettingsFromServer.query(null, function(theSettings) {
					settings = theSettings[0].settings;
					d.resolve();
				});
			} else
				d.resolve();
				
			return d.promise;
		};	 
		
		
		var methodCalc = function(method, altMethod, distance) {
				var ret = ((method == "estimated" && distance < MAX_DISTANCE_STATION) || altMethod === undefined) ? method : altMethod;
				return ret;
			};
		
			
		/**
		 * Restituisce i valori di configurazione.
		 * Se quelli dati sono indefiniti restituisce quelli di default chiesti al server (che dipendono
		 * dal profilo dell'utente), altrimenti quelli dati.
		 * Aggiunge funzioni necessarie. 
		 */	
		this.getSettings =  function(theSetting) {
			var supplied = angular.copy(theSetting);
			var defaults = angular.copy(settings);

			// Sostituisce i valori necessari, che sono nulli nel setting dato, con quelli di default
			if (supplied == undefined)
				supplied = defaults;
			else { 
				if (supplied.plantsListRow == undefined)
					supplied.plantsListRow = defaults.plantsListRow;
				if (supplied.energyTable == undefined)
					supplied.energyTable = defaults.energyTable;			
				if (supplied.chart == undefined)
					supplied.chart = defaults.chart;
			}

			
			// aggiungo proprieta' e funzioni di energyTable
			if (supplied.energyTable == undefined)
				supplied.energyTable = {};
			// La funzione per calcolare il metodo da applicare
			supplied.energyTable.methodCalc = methodCalc;
			
			// aggiungo proprieta' e funzioni di plantsListRow
			if (supplied.plantsListRow == undefined)
				supplied.plantsListRow = {};
			supplied.plantsListRow.methodCalc = methodCalc;
						
			// Aggiungo funzioni e proprieta' di chart
			if (supplied.chart == undefined)
				supplied.chart = {};
			// la condizione per visualizzare il valore stimato
			supplied.chart.estimatedCondition = function(distance) {
				return distance < MAX_DISTANCE_STATION;
			}
			
			// Aggiungo funzioni e proprieta' di chartHome
			if (supplied.chartHome == undefined)
				supplied.chartHome = {};
			// la condizione per visualizzare il valore stimato nel grafico di riepilogo (in home)				
			supplied.chartHome.estimatedCondition = function(distance) {
					return distance < MAX_DISTANCE_STATION;
			}
			
			return supplied;
		};
		
		// Setta i menu in rootScope in funzione delle impostazioni fornite
		this.setMenu = function(settings) {
			$rootScope.showProduzione = (settings.menu !== undefined && settings.menu.showObj.produzione !== undefined && settings.menu.showObj.produzione === false) ? false : true;
			$rootScope.showRicavi = (settings.menu !== undefined && settings.menu.showObj.ricavi !== undefined && settings.menu.showObj.ricavi === false) ? false : true;
			$rootScope.showAvvisi = (settings.menu !== undefined && settings.menu.showObj.avvisi !== undefined && settings.menu.showObj.avvisi === false) ? false : true;
			$rootScope.showImpostazioni = (settings.menu !== undefined && settings.menu.showObj.impostazioni !== undefined && settings.menu.showObj.impostazioni === false) ? false : true;
			$rootScope.showPremiumIcon = (settings.menuTop !== undefined && settings.menuTop.showPremium !== undefined && settings.menuTop.showPremium) ? true : false;
		}			
	})

// Utility per le conversioni di valori
	.factory('Utility', function() {
		function pad(number) {
			if (number < 10)
				return '0' + number;
			return number;
		}
		function _dateToIsoString(date) {
			var year = pad(date.getFullYear());
			var month = pad(date.getMonth() + 1);
			var day = pad(date.getDate());
			return year + '-' + month + '-' + day;
		}
		
		function _dateObj (dateIt) {
			try {
				var date = $.datepicker.parseDate('dd/mm/yy', dateIt); // data una stringa nel formato indicato restituisce l'oggetto data
				//var period = $.datepicker.formatDate('MM', date) + ' ' + date.getFullYear();
			} catch(err) {
				var date = null;
			}
			return date;
		}		
		return {
			dateToIsoString: function(date) {
				return _dateToIsoString(date);
			},
			todayIsoString: function() {
				var today = new Date();
				return _dateToIsoString(today);
			},
			// Data la data in formato iso restituisce il mese esteso e l'anno
			datePeriod: function(dateIso) {
				try {
					var date = $.datepicker.parseDate('yy-mm-dd', dateIso); // data una stringa nel formato indicato restituisce l'oggetto data
					var period = $.datepicker.formatDate('MM', date) + ' ' + date.getFullYear();
				} catch(err) {
					var period = null;
				}
				return period;
			},
			// restituisce l'oggetto data passando una data in formato italiano (dd/mm/yyyy)
			dateObj: function(dateIt) {
				return _dateObj(dateIt);
			},
			// restituisce l'anno della data in formato italiano
			dateYear: function(dateIt) {
				return _dateObj(dateIt).getFullYear();
			},
			// Restituisce l'oggetto Date data una data in formato iso
			// con spazio o T che separa data e orario
			// Importante perche' sql restituisce una data in formato iso8601 ma con lo spazio
			// che separa data e ora anziche' una T. Occorre aggiungere la T altrimenti Firefox
			// parsa il valore per fare Date.
			iso2Date: function(dateStr) {
				dateStr = dateStr.replace(" ", "T");
				return new Date(dateStr);
			}
		}
	})

	.factory('OrderedList', function(PRODUCT, SUBSCRIPTION, PLANTS_PRODUCT_CATEGORY_IDS) {
		return {
			get: function(ordered) {
				var plants = [];
				var plants2 = [];
				
				var plant = {};
				var count = 0;
				//console.log(ordered);
				
				var isInArray = function(arr, obj) {
				    for(var i=0; i<arr.length; i++) {
				        if (arr[i] == obj) return true;
				    }
				};
				
				for (var i=0; i<ordered.length; i++) {
					// Se l'id del prodotto e' quello della piattaforma non ha i dettagli che hanno invece le righe di impianto
					if (!isInArray(PLANTS_PRODUCT_CATEGORY_IDS, ordered[i].order_item.product.category_id) || ordered[i].status_name != 'delivered')
						continue;
					//if (ordered[i].order_item.product.id == PRODUCT.ACTIVE_LIST || ordered[i].status_name != 'delivered')
					//	continue;
					// Creo un'array di impianti letti dagli ordini. L'ordine piu' nuovo con lo stesso prodotto per lo stesso impianto
					// sovrascrive il precedente. In questo modo ho una lista dove compare l'impianto una sola volta e non anche per 
					// l'ordine scaduto
					plant = ordered[i].order_item;
					//plant.order_id = ordered[i].id;
					plant.activate_date = ordered[i].subscription_from;
					plant.expire = ordered[i].expire;
					plant.warning_expire = ordered[i].subscription_days_to_expiry < SUBSCRIPTION.DAYS_TO_EXPIRY && ordered[i].subscription_days_to_expiry >= 0 ? true : false;
					plant.expired = ordered[i].subscription_days_to_expiry < 0 ? true : false;
					plant.too_old = ordered[i].subscription_days_to_expiry <= -Math.abs(SUBSCRIPTION.TOO_OLD) ? true : false;
					plant.order_id = ordered[i].order_id;
					plant.subscription_days_to_expiry = ordered[i].subscription_days_to_expiry;
					
					// Con le chiavi sovrascrivo l'ordine precedente
					// TODO assumo che l'ordine con ID maggiore sia il piu' nuovo
					// Un ordine nuovo sovrascrive il vecchio e considero l'impianto attivo solo perche' la data di scadenza e' piu' avanti di oggi,
					// senza guardare la data di inizio dell'abbonamento. Puo' capitare allora un impianto attivo anche se ancora non e' giunta
					// la data di inizio del valore, ma poiche' considero questo caso (uno ordine con abbonamento che inizia piu' avanti) un caso
					// che si verifica solo in caso di rinnovo, lo ritengo valido (non dovrebbe mai esserci un buco tra la scadenza nel precendente ordine
					// e l'inizio del nuovo)
					// Sarebbe meglio comunque controllare la data di creazione anziche' l'id
					//console.log(plant);
					if (plant.product.options.plant.id !== undefined && plant.product.id !== undefined) {
						// Se ancora non c'e' l'impianto posso mettere tutto
						if (plants2[plant.product.options.plant.id] == undefined) {
							plants2[plant.product.options.plant.id] = [];
							plants2[plant.product.options.plant.id][plant.product.id] = plant;
						}
						// Se c'e' gia' il prodotto per questo impianto, lo sovrascrivo solo se ha un id maggiore
						if (plants2[plant.product.options.plant.id][plant.product.id] != undefined && plant.order_id > plants2[plant.product.options.plant.id][plant.product.id].order_id) 
							plants2[plant.product.options.plant.id][plant.product.id] = plant;
					}

				}
				
				for (var k in plants2) {
					for (var x in plants2[k]) {
						// Costruisco l'elenco degli impianti (plants)
						plants.push(plants2[k][x]);
						if (!plants2[k][x].expired)
							count++;
					}
				}

				return {"plants":plants, "count":count};
			}
		}
	})

// Calcola gli incassi
	.factory('Revenues', function() {
		// TODO lavora sui dati grezzi dell'impianto. Dargli invece i valori da plants/id?incoming
		// per uniformarla agli altri
		function getTotal(incentivi) {
			var sum = 0;
			for (var index = 0; index < incentivi.length; index++) {
				sum += parseFloat((String(incentivi[index].imponibile)).replace(',', '.'));
			}
			return sum;
		}
		function getTariffa(incentivi) {
			return incentivi[0].tariffa;
		}
		return {
			total: function(incentivi) {
				return getTotal(incentivi);
			},
			price: function(incentivi) {
				return getTariffa(incentivi);
			}
		}
	})

/**
	* Cancella tutti i dati
	*/
	.service('Clear', function(ReportData, Settings, Auth) {
		this.clear = function() {
			ReportData.clear();
			Settings.clear();
			Auth.clear();
		}
	})		

	/**
	 * Chiamata per il login
	 */
	.factory('Login', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/login',
			{},
			{
				save: {
					method: 'POST'
				}
			}
		);
	})

	/**
	 * Chiamata per il logout
	 */
	.factory('Logout', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/logout',
			{},
			{
				// risposta intercettata
				get: {
					method: 'POST',
					interceptor: answer
				},
				// risposta non intercettata
				simple: {
					method: 'POST'
				}
			}
		);
	})

	/**
	 * Chiamata per ricevere i dati dell'utente connesso
	 */
	.factory('CurrentUser', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/current-user',
			{},
			{
				get: {
					method: 'GET',
					interceptor: answer
				},
				getUnsafe: {
					method: 'GET'
				},				
			}
		);
	})


	/**
	 * Chiamate per registrare un nuovo utente
	 */
	.factory('Signup', function($resource, answer) {
		return $resource(
			'../../server/signup?step=:step',
			{},
			{
				save: {
					url: '../../server/signup?step=:step',
					method: 'POST',
					interceptor: answer
				},
				signupComplete: {
					url: '../../server?step=signup-complete',
					method: 'POST'
				}
			}
		);
	})

	.factory('Plants', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/resource/users/uid/plants/:id',
			{},
			{
				update: {
					method: 'PUT',
					interceptor: answer
				},
				get: {
					method: 'GET',
					interceptor: answer
				},
				query: {
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				summaryList: {
					url: 'https://app.sunreport.it/server/resource/users/uid/plants?summary',
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				energy: {
					url: 'https://app.sunreport.it/server/resource/users/uid/plants/:id?energy',
					method: 'GET',
					interceptor: answer
				},
				incoming: {
					url: '../../server/resource/users/uid/plants/:id?incoming',
					method: 'GET',
					interceptor: answer
				},				
				info: {
					url: 'https://app.sunreport.it/server/resource/users/uid/plants?info',					
					method: 'GET',
					interceptor: answer
				},
				userSettings: {
					url: '../../server/resource/users/uid/plant_user_settings?plant_id=:id',
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				reportSettings: {
					url: '../../server/resource/users/uid/report_settings?plant_id=:id',
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				sendReport: {
					url: '../../server/resource/users/uid/plants/:id?send-report',
					method: 'GET',
					interceptor: answer
				},				
				sspEnergy: {
					url: '../../server/resource/users/uid/plants/:id/ssp?energy-sum',
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				sspIncoming: {
					url: '../../server/resource/users/uid/plants/:id/ssp?incoming-sum',
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				sspHas: {
					url: '../../server/resource/users/uid/plants/:id/ssp?has',
					method: 'GET',
					interceptor: answer
				},
				getDevices: {
					url: '../../server/resource/users/uid/plants/:id/devices',
					isArray: true
				}
			}
		);
	})	
	
	.factory('Products', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/resource/products/:id',
			{},
			{
				get: {
					method: 'GET',
					interceptor: answer
				},
				getUnsafe: {
					method: 'GET'
				},
				query: {
					method: 'GET',
					isArray: true,
					interceptor: answer
				},
				coupons: {
					url: '../../server/resource/products?coupons',
					method: 'GET',
					isArray: true,
					interceptor: answer
				}
			}
		);
	})

	.factory('serverTime', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/time',
			{},
			{
				get: {
					method: 'GET',
					interceptor: answer
				}
			}
		);
	})

	.factory('SettingsFromServer', function($resource, answer) {
		return $resource(
			'https://app.sunreport.it/server/resource/users/uid/settings',
			{},
			{
				query: {
					method: 'GET',
					isArray: true,
					interceptor: answer
				}
			}
		);
	})
