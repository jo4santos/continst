continstApp.service('ServContinst', ['$rootScope', '$q','$http','FactSocket',function ($rootScope,$q,$http,FactSocket) {
	var self = this;
	var elements = {};
	
    FactSocket.on("images:list",function(data) {
    	//console.log(data);
    	elements = {};
    	for(var i in data.images) {
    		elements[data.images[i]._id] = data.images[i];
    	}
    	$rootScope.$broadcast("images:received",elements);
    });
    
	FactSocket.on('auth:confirm', function(data){
		$rootScope.username = data.username;
		FactSocket.emit('images:request');
    });
	FactSocket.on('clients:count', function(data){
		$rootScope.clients_count = data.number;
    });

	self.update = function() {
		var deferred = $q.defer();
		var instagram_url = "https://api.instagram.com/v1/media/popular?client_id=3eec7dbe06ee4dbc8cae449e92183264&callback=JSON_CALLBACK";
		$http.jsonp(instagram_url).success(function(response) {
			var images = [];
			for(var i in response.data) {
				if(response.data[i].type != "image") continue;
				images.push(response.data[i].images.standard_resolution.url);
			}
			for(var i in images) {
				FactSocket.emit('images:new', {'image_url':images[i]});
			}
            deferred.resolve("OK");
	    });
		return deferred.promise;
	}
    
	return self;
}])