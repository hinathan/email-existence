var dns = require('dns')
	, net = require('net');

exports.resolve = function(host,callback) {
	dns.resolveMx(host,function(err, addresses) {
		if(addresses && addresses.length) {
			return callback(err,addresses[0].exchange);
		}
		dns.resolve(host,function(err, addresses) {
			if(err) {
				return callback(err);
			}
			if(addresses && addresses.length) {
				return callback(err,addresses[0]);
			}
		});
	});
};

exports.check = function (email, callback) {
	exports.resolve(email.split('@')[1], function(err, address){
		if(err) {
			return callback(err);
		}
		if(!address) {
			return callback("No host found");
		}
		var conn = net.createConnection(25, address);
		var commands = [ "helo hi", "mail from: <"+email+">", "rcpt to: <"+email+">" ];
		var i = 0;
		conn.setEncoding('ascii');
		conn.on('connect', function() {
			conn.on('prompt', function () {
				if(i < 3){
					console.log(i + ': ' + commands[i]);
					conn.write(commands[i]);
					conn.write('\n');
					i++;
				} else {
					console.log('true');
					callback(err, true);
				}
			});	
			conn.on('false', function () {
				console.log('false');
				callback(err, false);
			});
			conn.on('undetermined', function () {
				console.log('undetermined');
				callback(err, false);
			});
			conn.on('data', function(data) {
				console.log("got: " + data);
				if(data.indexOf("220") != -1 || data.indexOf("250") != -1) {
					conn.emit('prompt');
				} else if(data.indexOf("550") != -1) {
					conn.emit("false");
				} else {
					conn.emit("undetermined");
				}
			});
		});
	});	
};