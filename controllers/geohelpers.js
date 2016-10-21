exports.lonLat2PointInTile = function(lon, lat, zoom) {
	var tx = ((180 + lon) / 360) * (1 << zoom);
	var lat_rad = lat * Math.PI / 180;
	// Using (1 << zoom) because origin is located at bottom-left
	var ty = (1 << zoom) - (1 - (Math.log(Math.tan(lat_rad) + 1.0 / Math.cos(lat_rad)) / Math.PI)) * (1 << zoom) / 2.0;

	return { tx: tx, ty: ty };
}

exports.lonLat2Tile = function(lon, lat, zoom) {
	var point = this.lonLat2PointInTile(lon, lat, zoom);

	return { tx: Math.floor(point.tx), ty: Math.floor(point.ty) };
}

// Tile anchors are located at the bottom-left

exports.tile2AnchorLonLat = function(tile) {
	// Substract 180 as all longitudes left of Greenwich meridian are negative
	var a_lon = tile.x / (1 << tile.zoom) * 360 - 180;

	var n = Math.PI - 2 * Math.PI * tile.y / (1 << tile.zoom);
	// Inversing with -1 because origin is located at bottom-left
	var a_lat = (-1) * 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

	return { lon: a_lon, lat: a_lat };
}

exports.computeTileBbox = function(tile) {
	var pt_a = this.tile2AnchorLonLat(tile);
	var pt_b = this.tile2AnchorLonLat(
		{ 
			x: tile.x + 1, 
			y: tile.y + 1, 
			zoom: tile.zoom 
		});

	return [ pt_a.lon, pt_b.lat, pt_b.lon, pt_a.lat ];
}