const async 	= require('async');
const mapnik 	= require('mapnik');

exports.compose = function(layers, callback) {

	var base = layers[0];
	layers = layers.slice(1, layers.length);

	var tasks = layers.map(function(img) {
		return function(done) {
			base.composite(img, function(err, res) {
				if (err) return done(err, null);
				done(null, null);
			});
		}
	});

	var promise = new Promise(function(resolve, reject) {
		async.series(tasks, function(err, res) {
			if (err) return reject(err);
			resolve(base);
		});
	});

	return promise;
}
