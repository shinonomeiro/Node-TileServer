const async 	= require('async');
const path 		= require('path');
const mapnik 	= require('mapnik');
const jimp 		= require('jimp');

exports.compose = function(imgs, callback) {

	var base = imgs[0];
	imgs = imgs.slice(1, imgs.length);

	var tasks = imgs.map(function(img) {
		return function(done) {
			base.composite(img, function(err, res) {
				if (err) return done(err, null);
				done(null, null);
			});
		}
	});

	async.series(tasks, function(err, res) {
		return callback(err, base);
	});
}
