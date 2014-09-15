var http = require('http');
var url = require('url');
var fs = require('fs');
var mongoose = require('mongoose');
var mime = require('mime');

var Schema = mongoose.Schema;

var imagesSchema = new Schema({
	url: String,
	votes: {
		count: {
			total: Number,
			up: Number,
			down: Number,
			score: Number
		},
		data: {
			username: String,
			vote: Boolean	
		}
	},
	comments: {
		count: Number,
		data: {
			username: String,
			text: String,
			create: Number
		}
	}
});

var db = mongoose.connect('mongodb://localhost/images');
var model = mongoose.model('Data', imagesSchema);
var Data = mongoose.model('Data');

var server = http.createServer(function(req, res){
    fs.readFile(__dirname + url.parse(req.url).pathname, function(err, data){
    	if (err){
    		res.writeHead(404);
    		res.write('404');
    		res.end();
    	}
    	if(data) {
	    	res.writeHead(200, {'Content-Type': mime.lookup(__dirname + url.parse(req.url).pathname)});
	    	res.write(data, 'utf8');
	    	res.end();
    	}
    });
});

server.listen(8001);

var io = require('socket.io').listen(server);

function images_update (socket) {
	var socket = socket || false;
	Data.find({}, function(err, images) {
		if(err) { throw err; }
		if(socket) {
			socket.emit('images:list', {'images':images});	
		}
		else {
			io.sockets.emit('images:list', {'images':images});	
		}
	});
}
var clients_count = 0;
io.sockets.on('connection', function(socket){
	console.log("Connected: "+socket.id);
	
	socket.on('auth:login', function(data){		
		console.log("Auth: "+socket.id + " | " + data.username);		
		socket.emit('auth:confirm', {'username':data.username});
		
		clients_count++;
	    io.sockets.emit('clients:count', { number: clients_count });
	    socket.on('disconnect', function () {
	    	clients_count--;
	        io.sockets.emit('clients:count', { number: clients_count });
	    });
		
		images_update(socket);
		
		socket.on('images:new', function(data){
	    	Data.find({url:data.image_url}, function(err, docs) {
	    		if(err) { throw err; }
	    		if(docs.length==0) {
	    			console.log("New image: "+socket.id + " | " + data.image_url);
	    			
	    	    	var image = new Data();
	    	    	image.url=data.image_url;
	    	    	image.votes.count.total=0;
	    	    	image.votes.count.up=0;
	    	    	image.votes.count.down=0;
	    	    	image.votes.count.score=0;
	    	    	image.votes.data=[];
	    	    	image.comments.data=[];
	    	    	
	    	    	image.save(function(err) {
	    	    		if(err) { throw err; }
	    	    		images_update();
	    	    	})
	    		}
	    	});
	    });
		
		socket.on('votes:new', function(data){
			/*
			 * Receives:
			 *  - data.username
			 *  - data.image_url
			 *  - data.vote_type
			 */
			
			Data.update({url:data.image_url}, {
	    		$pull: {"votes.data": {username:data.username}}
	    	}, function(err, numAffected, rawResponse) {
	    		if(err) { throw err; }
	    		Data.update({url:data.image_url}, {
		    		$push: {"votes.data": {username:data.username,vote:data.vote_type}}
		    	}, function(err, numAffected, rawResponse) {
		    		if(err) { throw err; }
		    		Data.find({url:data.image_url},function(err,image){
			    		if(err) { throw err; }
			    		var up = 0;
			    		var down = 0;
			    		for(var i in image[0].votes.data.toObject()) {
			    			if(!image[0].votes.data.toObject()[i].vote)	down++;
			    			else up++;
			    		}
			    		var score = up-down;
			    		Data.update({url:data.image_url}, {
				    		"votes.count.total": up+down,
				    		"votes.count.up": up,
				    		"votes.count.down": down,
				    		"votes.count.score": score
				    	}, function(err, numAffected, rawResponse) {
				    		//	Commented for usability
				    		images_update();				    		
				    	});
		    		});
		    	});
	    	});
	    });
		
		socket.on('votes:remove', function(data){
			/*
			 * Receives:
			 *  - data.username
			 *  - data.image_url
			 *  - data.vote_type
			 */
			
			Data.update({url:data.image_url}, {
	    		$pull: {"votes.data": {username:data.username}}
	    	}, function(err, numAffected, rawResponse) {
	    		if(err) { throw err; }
	    		Data.find({url:data.image_url},function(err,image){
		    		if(err) { throw err; }
		    		var up = 0;
		    		var down = 0;
		    		for(var i in image[0].votes.data.toObject()) {
		    			if(!image[0].votes.data.toObject()[i].vote)	down++;
		    			else up++;
		    		}
		    		var score = up-down;
		    		Data.update({url:data.image_url}, {
			    		"votes.count.total": up+down,
			    		"votes.count.up": up,
			    		"votes.count.down": down,
			    		"votes.count.score": score
			    	}, function(err, numAffected, rawResponse) {
			    		//	Commented for usability
			    		images_update(); 		
			    	});
	    		});
	    	});
	    });
		
		socket.on('comments:new', function(data){
			/*
			 * Receives:
			 *  - data.username
			 *  - data.image_url
			 *  - data.text
			 */
			Data.update({url:data.image_url}, {
	    		$push: {"comments.data": {username:data.username,text:data.text,create:new Date().getTime()}}
	    	}, function(err, numAffected, rawResponse) {
	    		if(err) { throw err; }
	    		Data.find({url:data.image_url},function(err,image){
		    		if(err) { throw err; }
		    		Data.update({url:data.image_url}, {
			    		"comments.count": image[0].comments.data.toObject().length,
			    	}, function(err, numAffected, rawResponse) {
			    		//	Commented for usability
			    		images_update();				    		
			    	});
	    		});
	    	});
			
	    });
		
	});
	
});