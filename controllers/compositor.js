const async = require('async');
const path = require('path');
const jimp = require('jimp');

exports.compose = function(pathList, callback) {
	jimp.read(pathList[0], function(err, base) {
		if (err) return callback(err, base);

		pathList.slice(1, pathList.length);

		var tasks = pathList.map(function(path) {
			return function(done) {
				jimp.read(path, function(err, layer) {
					if (err) return done(err);

					base.composite(layer, 0, 0);
					done(err);
				});
			}
		});

		async.series(tasks, function(err) {
			return callback(err, base);
		});
	});
}
