
// register the interceptor as a service
// Chiamato dal servizio ajax, se riceve un errore 401 redirige al login
angular.module('ttSecurity', [])
.factory('answer', function($location, $window) {
	return {
		//'response': function(response) {
		//	console.log(response.status);
		//	return response.resource;
		//},
		//response: function(data) {
		//	console.log('risposta giusta: ', data);
		//},
		'responseError': function(header) {
			if (header.status == 303) {
				//console.log(header.status);
				//$location.path('/report/signup-complete');
			} else if (header.status == 401 || header.status == 404) {
				$window.location.reload();
				$location.path('/login');
			} else {
				console.log(header);
				//alert('Errore dal server: ' + header + '.');
			}
		}
	}
});
