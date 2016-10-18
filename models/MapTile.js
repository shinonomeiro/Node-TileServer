const mongoose = require('mongoose');

const mapTileSchema = new mongoose.Schema({
	hash: 	String, 	// Hashed coordinates
	path: 	String, 	// Path to file on filesystem
	date: 	Date, 		// Created on
	bbox: 	Array 		// Bounding box coordinates [lat1, lon1, lat2, lon2]
});

var MapTile = mongoose.model('MapTile', mapTileSchema);

module.exports = MapTile;