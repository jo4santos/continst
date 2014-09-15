continstApp.controller('CtrlContinst', ['$rootScope','$scope','FactSocket','ServContinst','$modal',function ($rootScope,$scope,FactSocket,ServContinst,$modal) {
	$scope.elements = [];
	$scope.comments = [];
	if(localStorage["username"]) {
		$scope.username = localStorage["username"];
		FactSocket.emit('auth:login', {'username':localStorage["username"]});
	}
	
	
	$rootScope.$on("images:received", function(e,data){
		$scope.elements = angular.copy(data);
		//console.log($scope.elements);
    })
	$scope.auth = function(authForm) {
		if (authForm.$valid) {
			FactSocket.emit('auth:login', {'username':$scope.username});
			localStorage["username"] = $scope.username;
		}
	}
	$scope.logout = function() {
		localStorage.removeItem("username");
		location.reload();
	}
	$scope.image_send = function() {
		FactSocket.emit('images:new', {'image_url':$scope.image_url});
	}
	$scope.comment = function(image_url,id) {
		if($scope.comments[id]) {
			FactSocket.emit('comments:new', {'image_url':image_url,'username':$scope.username,'text':$scope.comments[id]});
		}
		$scope.comments[id] = "";
	}
	$scope.vote = function(image_url,vote_type) {
		FactSocket.emit('votes:new', {'image_url':image_url,'username':$scope.username,'vote_type':vote_type});
	}
	$scope.unvote = function(image_url) {
		FactSocket.emit('votes:remove', {'image_url':image_url,'username':$scope.username});
	}
	$scope.update = function() {
		$scope.updating = true;
		ServContinst.update().then(function(){
			$scope.updating = false;
		});
	}
	$scope.toggleSlideHandleLeft = function () {
		if(this.sharing_active)
			this.sharing_active = false;
		else
			this.comments_active = true;
	}
	$scope.toggleSlideHandleRight = function () {
		if(this.comments_active)
			this.comments_active = false;
		else
			this.sharing_active = true;
	}
	$scope.toggleComments = function () {
		this.comments_active=!this.comments_active;
		this.sharing_active=false;
	}
	$scope.toggleSharing = function () {
		this.sharing_active=!this.sharing_active;
		this.comments_active=false;
	}
	$scope.openImage =  function(image){
		if(image.length==1) return;
		$scope.selectedImage = image;
		var modalInstance = $modal.open({
		      templateUrl: 'ci-modal-image.html',
		      size:'lg',
		      controller: function ($scope, $modalInstance, image) {
		    	  $scope.image = image;
		    	  
		    	  $scope.close = function () {
		    		  $modalInstance.dismiss();
		    	  };
		    	},
		        resolve: {
		        	image: function () {
		              return $scope.selectedImage;
		            }
		          }
		    });
	}
}])