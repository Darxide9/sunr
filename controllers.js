angular.module('myApp.controllers', [])


.run(function($rootScope, $ionicLoading){

	$rootScope.showLoading = function() {
	    $ionicLoading.show({
	      template: '<ion-spinner icon="ripple"></ion-spinner>',
	      animation: undefined
	    })
	  };
	//$scope.showLoading();
	//debugger;
	$rootScope.hideLoading = function(){
	    $ionicLoading.hide()
	  };	

})

/* Login */
.controller('LoginCtrl', function(
	$scope,
	$location, 
	$state, 
	$http,
	Login, 
	$rootScope, 
	CurrentUser,  
	SignupData,  
	Auth,
	Clear, 
	USER_TYPE, 
	$window,
	$ionicLoading)
{

	$scope.login = {};
	$scope.loginFailed = false;
	

	// Imposta la lingua del login, default come impostato in LANGUAGE_DEFAULT
	// Legge il parametro lang che si conserva anche se ricarico la pagina

	/*
	if ($location.search().lang !== undefined) {
		gettextCatalog.setCurrentLanguage($location.search().lang);
	} else
		gettextCatalog.setCurrentLanguage(LANGUAGE_DEFAULT);
	*/
	// I tipi di utente selezionabili nel form del template
	//$scope.userTypes = USER_TYPE;

	// I tipi di utente selezionabili nel form del template
	$scope.userTypes = USER_TYPE;

	$scope.login.send = function() {


		// resetto i dati, nel caso logout non l'avesse fatto
		Clear.clear();
		
		// Invio le credenziali inserite e il tipo che e' settato con una
		// variabile nascosta nel form
		
		var p = Auth.login($scope.login.userid, $scope.login.password, $scope.login.type);
		p.then(function(user) {
			// Il server fa una query per userid, password e tipo
			if (user === null) {
				$scope.loginFailed = true;
			// Redirect alle pagine dell'amministratore
			} else if (user.type == USER_TYPE.ADMIN) {
				//$location.path('report/admin/home');
			} else if (user.type == USER_TYPE.AGENT) {
				//$location.path('report/agent/home')
			} else {
				// Se l'utente e' attivo vai all'inizio
				if (user.active === true) {
					//$rootScope.showLoading();
					$state.go('main.summary', {}, { reload: true });
				/*	
					$location.search('lang', null);
					$location.path('/report/home');		
				*/
				// altrimenti completa i passi di registrazione indicati dal
				// server
				
				} else {
					// CurrentUser.get(null, function(current) {
						// console.log(user.next_step);
						//SignupData.setWizardStep(routeAccess[user.next_step].wizardStep);
						//$location.path(routeAccess[user.next_step].route);	
					// });
				}
			}
		});
		
	};

})


.controller('SignupCtrl', function($scope, $location, gettextCatalog, LANGUAGE_DEFAULT, Signup, Logout, SignupData, routeAccess, Users, USER_TYPE) {
	// e' stato fatto il logout dell'utente eventualmente loggato dal route
	// prima di arrivare qui.
	$scope.info = {};
	$scope.account = {};
	// Logout - serve se l'utente torna indietro
	Logout.simple();
	
	// Imposta la lingua di registrazione, default italiano
	// Legge il parametro lang che si conserva anche se ricarico la pagina
	if ($location.search().lang !== undefined) {
		gettextCatalog.setCurrentLanguage($location.search().lang);
	} else
		gettextCatalog.setCurrentLanguage(LANGUAGE_DEFAULT);
	
	// I tipi di utente selezionabili nel form del template
	$scope.info.userTypes = USER_TYPE;
		
	// chiamato all'invio del form di registrazione
	$scope.info.signup = function() {
		// Il server, prima di registrare, fa il logout dell'eventuale
		// utente connesso
		$scope.info.useridTaken = false;
		$scope.info.userRegistered = false;
		Signup.save({'step':'user-data'}, $scope.user, function(next) {
			// leggo la risposta e faccio qualcosa
			// se il server mi dice che l'utente deve validare l'email lo
			// avviso
			// (caso, ad esempio, di userid uguale e password diversa)
			if (next.info != undefined && next.info == 'userid_used') {
				$scope.info.useridTaken = true;
			} else if (next.info != undefined && next.info == 'please_login') {
				$scope.info.userRegistered = true;
			// Il server mi dice qual'e' il prossimo passo. Nel servizio
			// routeAccess ho scritto
			// quale route e passo del wizard corrisponde al passo indicato.
			} else if (next.next_step != undefined) {
				// Salvo la lingua
				// La lingua e' quella settata in gettextcatalog dal topCtrl al caricamento della pagina
				// Se per qualche motivo non e' settata sara' quella di default del plugin (en)
				// La politica e' che la lingua dell'utente e' quella che ha visto al login
				// Potra' poi cambiarla nelle sue impostazioni
				Users.setLanguage(null, {language: gettextCatalog.getCurrentLanguage()}, function(user) {
					// redirigo dove mi dice il server (vedi il servizio
					// routeAccess). Il passo del wizard eventuale
					// lo faccio rileggere da SignupWizardCtrl
					var red = routeAccess[next.next_step].route;
					$location.path(red);
				});
			}
		});
	};
})

//lo uso perchè il compontente ionic per gestire la navigazione è un "pain in the ass" per cui scrivo qui la funzione che chiamo col bottone per tornare indietro nell'history delle views.
.controller('MainController', function($scope, $ionicHistory){
	$scope.goBack = function(){
		$ionicHistory.goBack();
	}
})

/**
 * Controller della home page dell'applicazione Dopo il login si arriva alla
 * pagina home con questo controller. Viene testato il numero di impianti e
 * se sono piu' di uno viene visualizzata una lista, altrimenti viene
 * diretto su home-single. Prevedo la visualizzazione multipla anche se
 * l'utente e' nel gruppo professional, anche se ha un solo impianto: TODO
 * la politica che prevede visione multipla basata solo sul numero di
 * impianti e' restrittiva: potrebbero esistere installatori che vogliono la
 * piattaforma e hanno per ora un solo impianto. Dalla lista puo' venire
 * richiesto un riepilogo di un dato impianto. Sequenza: Impianto singolo:
 * Login -> /home (-> plantsNumber == 1) -> /home-single Impianti multipli
 * (o customer_group_id == 4): Login -> /home (-> visualizzazione lista) ->
 * (scelta impianto) -> /home-single
 */
.controller('SummaryCtrl', function($scope, $window, $rootScope, Settings, serverTime, OrderedList, ReportData, PlantData, $filter, Auth,  $ionicLoading, $ionicPopup, $timeout, $state) {
	$scope.limit = 15;
	  

    $window.onscroll = function() {
    	scrollStart = $scope.scrollPos;
        $scope.scrollPos = document.b.scrollTop || document.documentElement.scrollTop || 0;
        if ($scope.scrollPos - scrollStart > 0) {
        	$scope.limit += 15;
            $scope.$apply(); // or simply $scope.$digest();
        }
    };

    $scope.loadItems = function(){

    	$scope.limit += 15;
    	$scope.$broadcast('scroll.infiniteScrollComplete');
    }
	    
    $scope.filterPlantsList = function(plantname){
    	$scope.filteredSummaryList = $filter('filter')($scope.summaryList, plantname);
    }


    //$scope.showLoading();
	$scope.timeNow = serverTime.now;
	/*if (orders != undefined) {
		// Creo la lista degli impianti ordinati e non ancora pagati
		var plantsOrdered = {};
		for (var i=0; i < orders.length; i++) {
			if (orders[i].status_name == 'wait_payment' && orders[i].items != undefined) {
				for (var z=0; z < orders[i].items.length; z++) {
					if (orders[i].items[z].product.options !== undefined && orders[i].items[z].product.options.plant !== undefined && orders[i].items[z].product.options.plant.id !== undefined) {
						plantsOrdered[orders[i].items[z].product.options.plant.id] = true;
					}
				}
			}
		}
		$scope.plantsOrdered = plantsOrdered;
	}*/
	

	//var delivered = OrderedList.get(deliveredProducts).plants;
	
	// Tutti gli impianti acquistati per id
	/*
	$scope.deliveredById = [];
	for (var i=0;i<delivered.length;i++) {
		$scope.deliveredById[delivered[i].product.options.plant.id] = delivered[i];
	}
	*/
	
	// Per passare il numero degli ordini totali del cliente gia' fatti
	// serve alla direttiva new-rows per sapere se aggiungere o meno
	// l'attivazione della piattaforma
	// ogni volta che aggiunge un impianto
	// multiimpianto (chiama al suo interno il metodo
	// CartSun.addFirstActivationOrder()
	// TODO Avrebbe potuto essere il numero di righe di plantsOrdered
	// calcolato qui sopra, ma lo recupero
	// comunque dal server per dare uniformita' con altre chiamate; inoltre
	// potrebbero esserci delle politiche diverse
	// per definire il numero totale di ordini fatti

	//$scope.totalOrders = ReportData.getTotalOrders()[0] !== undefined ? ReportData.getTotalOrders()[0].completed : 0;
	
	var user = Auth.getUser();
	// Carico i prodotti dal server
	//CartSun.setProducts(ReportData.getProducts());
	
	// setto nel carrello lo sconto gia' previsto per il cliente
	// presente nel discounts_generator del server e il catalogo
	// perche' serve per calcolare la preview dei prezzi
	//if (discounts.length > 0)
	//	CartSun.setUserDiscount(discounts);			

	// Se il metodo setItemsPrice trova articoli non presenti in catalogo
	// torna false. Meglio cancellare il carrello.
	//if (CartSun.setItemsPrice() === false)
	//	CartSun.clear();

	/*
	// Cancello il coupon eventualmente rimasto da sessioni precedenti
	var pc = CartSun.clearCoupon(true);
	
	pc.then(function() {
		// Salvo il carrello
		CartSun.save(user.id);
		// Calcolo il totale del carrello
		CartSun.setTotalAmount();
		
	});
	*/
	
	/*
	$scope.goToBuy = function() {
		// Resetto l'eventuale ordine precedente: potrebbe essere cambiato
		// il carrello
		Checkout.clear();
		$location.path('/report/checkout/');
	}
	
	*/

	// Voglio sapere gli impianti che sono nel carrello per settare i
	// bottoni
	// Recupero il carrello e faccio settare i bottoni ($scope.plantsCart
	// viene passato
	// alla direttiva new-row che costruisce le righe della tabella. Settato
	// i bottoni
	// e' come avere ricreato gli acquisti e allora viene fatto tutto, come
	// ad esempio
	// riaprire il bottone del carrello
	//CartSun.setIdPlants();
	//$scope.plantsCart = CartSun.getIdPlants();
	
	// Recupero il listino: serve alla direttiva cart-summary per calcolare
	// l'importo
	//$scope.productList = ReportData.getProducts();
	
	// Prevedo la visualizzazione multipla anche se l'utente e' nel gruppo
	// professional
	if ($rootScope.plantsNumber > 1 || user.customer_group_id == 4) {
		// Indico che sono in home multi alla barra orizzontale per mostrare
		// il giusto link per l'acquisto premium
		$rootScope.homeType = 'multi';
		// Prima di caricare la lista ho bisogno delle impostazioni
		// di default dal server che potrebbero servire se nel sommario
		// degli impianti non ci sono
		Settings.load().then(function() {
			var list = ReportData.getPlantsSummaryList();
			$scope.summaryList = $filter('orderBy')(list, 'ragione_sociale_operatore', false);

			//dovrò usarla per la funzione cerca
			$scope.filteredSummaryList = $scope.summaryList;


			$scope.predicate = 'ragione_sociale_operatore';
		});
		
		// Visualizza la barra per completare gli acquisti
		
		// $scope.showBuy = function() {
		// 	var ret = (CartSun.getNumberOfItems() > 0) ? true : false;
		// 	return ret;
		// }
		
		// $scope.setall = {};
		// $scope.setall.set = true;
		// $scope.buttonClick = false;
		
		// Setto il checkbox che seleziona tutte le righe per l'acquisto
/*			$scope.setAllOrderStatus = function() {
			
			$scope.buttonClick = !$scope.buttonClick;
			// Resetto: la politica e' annullare tutte le selezioni singole, ma non l'elenco dei prodotti
			CartSun.clear(true);
			// Attiva se il checkbox e' selezionato. Lo stato viene poi
			// salvato dall'ultima delle
			// righe (vedi dentro la direttiva new-row)
			$scope.activeall = $scope.setall.set;			
		};
		
		$scope.deselectBoxAll = function() {
			$scope.setall.set = false;
		};
		*/
	} else {

/*			var path = '/report/home-single/' + ReportData.getCurrentPlant().id;
		$location.path(path);*/
	}


})

//Impianto singolo
.controller('SingleCtrl', function($scope, $rootScope, ReportData, PlantData, Utility, Settings, $ionicHistory) {
			// Indico che sono in home single alla barra orizzontale per
			// mostrare il giusto link per l'acquisto premium
			$rootScope.homeType = 'single';
			// dati disponibili perche' caricati al caricamento della pagina
			// e tenuti in una variabile nel singleton ReportData
			$scope.plant = ReportData.getCurrentPlant();
			
			if ($scope.plant.subscription_days_to_expiry != undefined && $scope.plant.subscription_days_to_expiry < 45)
				$rootScope.toRenew = $scope.plant.subscription_days_to_expiry;

			var id = $scope.plant.id
			var maxYearMeasures = 0; // L'ultimo anno delle serie di energia,
										// usato per indicare quale anno
										// visualizzare
			
			// Leggo le impostazioni proprie dell'impianto e le passo
			// a getSettings che aggiunge metodi necessari e se sono nulle
			// fornisce quelle di default
			// lette quando e' stata caricata la pagina.
			// Le impostazioni di default sono associate a un profilo
			// dell'utente scritto nel suo record
			var settings = Settings.getSettings($scope.plant.settings);
			
			// setta i menu
			Settings.setMenu(settings);
			
			// cosa visualizzare nella pagina
			$scope.showMonthPie = (settings.singleHome !== undefined && settings.singleHome.showObj.monthpie !== undefined && settings.singleHome.showObj.monthpie === false) ? false : true;
			$scope.showYearPie = (settings.singleHome !== undefined && settings.singleHome.showObj.yearpie !== undefined && settings.singleHome.showObj.yearpie === false) ? false : true;			
			$scope.col = ($scope.showMonthPie && $scope.showYearPie) ? '3' : '6';
			
			// L'energia e i dati che servono al grafico
			$scope.energia = ReportData.getCurrentPlantEnergy();
			for (var yearIndex in $scope.energia.all) {
				if (yearIndex > maxYearMeasures)
					maxYearMeasures = yearIndex;
			}
			
			// Eventuali avvisi
			var noMeasure = false;
			$scope.noMeasureMonths = [];
			var theMonth;
			for (var yearIndex in $scope.energia.all) {
				var months = $scope.energia.all[yearIndex];
				for (var monthIndex in months) {
					if (months[monthIndex].real_flagged !== undefined 
						&& months[monthIndex].real_flagged.source !== undefined
						&& months[monthIndex].real_flagged.source == 'our_estimate'
						) {
						noMeasure = true;
						theMonth = months[monthIndex].mese.length == 1 ? 0 + months[monthIndex].mese : months[monthIndex].mese;
						$scope.noMeasureMonths.push(yearIndex + '-' + theMonth + '-' + '01');
					}
				}
			}
			// console.log(noMeasureMonths);
			
			// L'anno di riferimento con cui visualizzare il grafico
			$scope.year = maxYearMeasures;
			
			$scope.settingsChart = settings.chartHome;
			$scope.settingsPie = settings.plantsListRow; // uso lo stesso
															// setting delle
															// righe della
															// tabella
															// multiimpianto
			
			// Se il grafico visualizza la curva stimata allora visualizzo la
			// stazione meteo
			var show = $scope.settingsChart.show;
			var isEstimated = false;
			for (var i = 0; i < show.length; i++) {
				if (show[i] == "estimated")
					isEstimated = true;
			}
			$scope.showStation = (Settings.getSettings().chart.estimatedCondition($scope.energia.info.radiations_station_distance) && isEstimated) ? true : false;
			
			$scope.satellite = $scope.energia.info.radiations_satellite === false ? false : true;
			if (!$scope.satellite)
				$scope.stazione = $scope.energia.info.radiations_station_town;
			$scope.distance = $scope.energia.info.radiations_station_distance;
			
			
			// stato dell'impianto
			$scope.stato = PlantData.getStatoImpianto($scope.plant);
			
			// la struttura
			$scope.struttureBase = PlantData.getStrutture($scope.plant);
			
			if ($scope.plant.user_set != undefined && $scope.plant.user_set.surfaces != undefined)
				$scope.strutture = $scope.plant.user_set.surfaces;
			else
				$scope.strutture = $scope.struttureBase;
			
			$scope.getStrutturaBase = function(index) {
				if ($scope.struttureBase === undefined)
					return undefined;
				return $scope.struttureBase[index];
			}
			
			// gli inverter
			$scope.convertitori = PlantData.getConvertitori($scope.plant);
			
			// i moduli
			$scope.moduli = PlantData.getModuli($scope.plant);

			// il tipo
			$scope.tipo = $scope.stato.rbl_sito_tipologia !== undefined ? $scope.stato.rbl_sito_tipologia : $scope.stato.scheda_tecnica_rbl_sito_tipologia;
			
			// dati di descrizione dell'impianto da mostrare
			$scope.plantPower = $scope.stato.potenza_nominale;
			$scope.plantOperator = ($scope.plant.nome_operatore + ' ' + $scope.plant.ragione_sociale_operatore).trim();
			$scope.plantAddress = $scope.stato.localita;
			$scope.hasSsp = ReportData.getHasSsp();
})

//scheda produzione
.controller('ProduzioneCtrl', function($scope, $rootScope, ReportData, PlantData, Settings, $ionicHistory) {

		$scope.nextYear = function(){

			index = years.indexOf($scope.yearS);

			//se ci sono elementi dopo vuol dire che ho degli anni più recenti disponibili
			if (index < (years.length - 1)){
				$scope.yearS = years[index + 1];
			}

		}

		$scope.prevYear = function(){

			index = years.indexOf($scope.yearS);

			//se ci sono elementi prima vuol dire che ho degli anni più vecchi disponibili
			if (index > 0){
				$scope.yearS = years[index - 1];
			}		
		}

		var maxYearMeasures = 0; // L'ultimo anno delle serie di energia,
									// usato per indicare quale anno
									// visualizzare
		$scope.plant = ReportData.getCurrentPlant();
		$scope.energia = ReportData.getCurrentPlantEnergy();


		//TODO fai in modo che l'array con gli anni sia sempre ordinato altrimenti le funzioni prevYear e
		//nextYear non si comportano correttamente in caso non lo sia
		var years= [];
		for (var yearIndex in $scope.energia.all) {
			years.push(yearIndex);
			if (yearIndex > maxYearMeasures)
				maxYearMeasures = yearIndex;
		}
		// L'anno di riferimento con cui visualizzare il grafico
		$scope.yearS = maxYearMeasures;
		maxYear = maxYearMeasures;	

		var settings = Settings.getSettings($scope.plant.settings);
		
		// setto i menu
		Settings.setMenu(settings);
		
		// configurazione del grafico passata alla direttiva per configurarla
		$scope.settingsChart = settings.chart;
		
		// configurazione della tabella passata alla direttiva per configurarla
		$scope.settingsTable = settings.energyTable;
						
		$scope.misure = PlantData.getMisureList($scope.plant);
		$scope.stato = PlantData.getStatoImpianto($scope.plant);

		$scope.plantPower = $scope.stato.potenza_nominale;
		$scope.plantOperator = ($scope.plant.nome_operatore + ' ' + $scope.plant.ragione_sociale_operatore).trim();
		$scope.plantAddress = $scope.stato.localita;
		$scope.hasSsp = ReportData.getHasSsp();		
	})
	
