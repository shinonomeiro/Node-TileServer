const sha256 		= require('js-sha256');
const path 			= require('path');
const fs			= require('fs');

const renderer 		= require('./renderer');

exports.getTile = function(req, res, next) {
	var tile = new TileInfo(req.params);

	fs.stat(tile.dirpath, function(err, stats) {
		if (err) return next(err);

		fs.stat(tile.filepath, function(err, stats) {
			if (err) return next(err);

			return sendTile(tile.filepath, req, res, next);
		});
	});
}

exports.renderTile = function(req, res, next) {
	var tile = new TileInfo(req.params);

	fs.stat(tile.dirpath, function(err, stats) {
		if (err) {
			fs.mkdir(tile.dirpath, function(err) {
				if (err) return next(err);
			});
		}
	});

	renderer.renderTile(tile, tile.filepath)
		.then(function() {
			sendTile(tile.filepath, req, res, next);
		})
		.catch(function(err) {
			next(err);
		});
}

function TileInfo(params) {
	this.x = parseInt(params.tx), // or < x : + req.params.tx >
	this.y = parseInt(params.ty),
	this.zoom = parseInt(params.zoom),
	this.dirpath = `tiles/${this.zoom}/${this.x}`,
	this.filepath = `${this.dirpath}/${this.y}.png`
}

TileInfo.prototype.toString = function() {
	return `${this.zoom}/${this.x}/${this.y}`;
}

function sendTile(filepath, req, res, next) {
	var opt = {
		root: path.resolve('.'),
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true,
		}
	};

	res.sendFile(filepath, opt, function(err) {
		if (err) next(err);
	});
}