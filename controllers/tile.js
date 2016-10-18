const sha256 		= require('js-sha256');
const path 			= require('path');
const fs			= require('fs');

const renderer 		= require('./renderer');

exports.getTile = function(req, res, next) {
	var tile = {
		x: parseInt(req.params.tx),
		y: parseInt(req.params.ty),
		zoom: parseInt(req.params.zoom)
	}

	console.log('Attempting to retrieve requested tile from storage...');

	var dirpath = `tiles/${tile.zoom}/${tile.x}`;
	var filepath = `${dirpath}/${tile.y}.png`;

	fs.stat(dirpath, function(err, stats) {
		if (err) {
			console.log('Directory ' + dirpath + ' does not exist, creating new');

			fs.mkdir(dirpath, function(err) {
				if (err) return next(err);

				renderTile(tile, filepath, req, res, next);
			});

			return;
		}

		fs.stat(filepath, function(err, stats) {
			if (err) {
				console.log('Requested tile could not be found');
				
				return renderTile(tile, filepath, req, res, next);
			}

			console.log("Found");

			return sendTile(filepath, req, res, next);
		});
	});
}

function renderTile(tile, filepath, req, res, next) {
	renderer.renderTile(tile, filepath, function(err) {
		if (err) return next(err);
		sendTile(filepath, req, res, next);
	});
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