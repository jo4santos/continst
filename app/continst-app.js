var continstApp = angular.module("continstApp",['ngTouch','angular-inview','pasvaz.bindonce','ui.bootstrap']);
continstApp.run(['$rootScope',function($rootScope){
	
}]);
continstApp.factory('FactSocket', function ($rootScope) {
	var url = document.URL.toLowerCase().replace("/index.html","");
	var socket = io.connect(url);
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});
continstApp.filter('orderByScore', function() {
	return function(obj) {
		var array = [];
		Object.keys(obj).forEach(function(key) {
			array.push(obj[key]);
		});
		array.sort(function(a, b) {
			return parseInt(b.votes.count.score) - parseInt(a.votes.count.score);
		});
		return array;
	}});