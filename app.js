'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
	'ionic',
	'ionic.contrib.drawer',
	'myApp.filters',
	'ngResource',
	'myApp.controllers',
	'myApp.services',
	'ttSecurity',
	'ngMockE2E',
	'myApp.directives',
	'easypiechart'
])

.config(function($stateProvider, $urlRouterProvider){

	$stateProvider

	    /**
	 	* Route per il login
	 	*/
	 	.state('login', {
	 		url: '/login',
	 		templateUrl: 'templates/login.html',
	 		controller: 'LoginCtrl'
	 	})

	 	/**
		Route per la home. la vista padre astratta è un wrapper che include il menu laterale, così potrei avere più viste con il menu disponibile. Se deciderò che questo menu è apribile solo dal summary non ne avrò bisogno
		e includerò il menu direttamente nella vista summary.
	 	*/
		.state('main', {
				url: '/main',
				templateUrl: 'templates/main.html',
				controller: "MainController",
				abstract : true,
				resolve : {

					auth: function(Auth) {
						return Auth.loadUser(true);
					},
					data: function(ReportData) {
						return ReportData.loadFirst();
					},
					products: function(ReportData) {
						return ReportData.loadProducts();
					}					
				}
				})
		.state('main.summary',{
				url: '/summary',
				views: {
					'mainContent': {
						controller : "SummaryCtrl",
						templateUrl : "templates/summary.html"
					}}

		})

		.state('main.single',{
			url : '/single/:id',
			views : {
				'mainContent' : {
					templateUrl : "templates/single.html",
					controller : "SingleCtrl",
					resolve: {
						data: function(ReportData, $stateParams) {
							return ReportData.loadCurrentPlantAndEnergy($stateParams.id);
						},
						settings: function(Settings) {
							return Settings.load();
						},
						user: function(Auth) {
							return Auth.loadUser();
						}				
					}					
				}
			}

		})

		.state('main.produzione',{
			url:'/energy/:id',
			views : {
				'mainContent' : {
					templateUrl : "templates/produzione.html",
					controller : "ProduzioneCtrl",
					resolve:{
						data: function(ReportData, $stateParams) {
							return ReportData.loadCurrentPlantAndEnergy($stateParams.id);
						},
						settings: function(Settings) {
							return Settings.load();
						},
						user: function(Auth) {
							return Auth.loadUser();
						}							
					}
				}
			}
		})

	$urlRouterProvider.otherwise('/login');	
})

.run(function($httpBackend){
  //stub API calls usate per testare
  $httpBackend.whenGET('https://app.sunreport.it/server/current-user').respond(getFakeUser());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/users/uid/plants?summary').respond(getFakePlantsSummary());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/users/uid/plants?info').respond(getFakePlantsInfo());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/users/uid/settings').respond(getFakeSettings());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/products').respond(getFakeProducts());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/users/uid/plants/2').respond(getFakeSinglePlant());
  $httpBackend.whenGET('https://app.sunreport.it/server/resource/users/uid/plants/2?energy').respond(getFakeSinglePlantEnergy());

  $httpBackend.whenGET('https://app.sunreport.it/server/time').respond(getFakeDate());
  $httpBackend.whenPOST('https://app.sunreport.it/server/logout').respond("OK");

  $httpBackend.whenPOST('https://app.sunreport.it/server/login').passThrough()
  $httpBackend.whenGET(/fragments\/panel-chart.tpl.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/fragments\/panel-widget.tpl.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/partials\/panel-chart.tpl.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/partials\/energy-table.tpl.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/partials\/panel-widget.tpl.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/partials\/multi-row.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/partials\/searchbar.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/templates\/main.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/templates\/summary.html/).passThrough(); // Requests for templates are handled by the real server
  $httpBackend.whenGET(/templates\/produzione.html/).passThrough(); // Requests for templates are handled by the real server

})

	/**
	 * Route per la registrazione
	 
	$routeProvider.when(
		'/signup', 
		{
			templateUrl: 'partials/signup.html?v=0.6.0', 
			controller: 'SignupCtrl',
			resolve: function(Logout) {
				return Logout.simple();
			}
		}
	);
	*/