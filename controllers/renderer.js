const async 		= require('async');
const mapnik 		= require('mapnik');
const sha256 		= require('js-sha256');
const fs 			= require('fs');
const path 			= require('path');

const geohelpers	= require('./geohelpers');
const composer 		= require('./composer');

TILE_SIZE = 256;

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

var postgis_settings = {
	'type'              : 'postgis',
  	'host'              : process.env.PSQL_HOST,
  	'dbname'            : process.env.PSQL_DB,
  	'user'              : process.env.PSQL_USER,
  	'password'          : process.env.PSQL_PASS,
  	'table'             : '',
  	'estimate_extent'   : '0'
};

var proj = '+init=epsg:3857'; // Web Mercator projection
var bgColor = new mapnik.Color("transparent");
var bbox;

exports.renderTile = function(tile, filepath, callback) {

	bbox = geohelpers.computeTileBbox(tile);

	console.log('Rendering tile layers with mapnik...');
	console.log('Tile: ' + tile.toString());
	console.log('Bbox: ' + bbox);

	// RUN IN ORDER //

	var layers = [
		function(done) {
			renderMap(
			  	['land_styles'],
			  	'(select geom from tokyo_japan_land_coast) as res',
			  	done);
		},
		function(done) {
			renderMap(
			  	['water_styles'],
			  	'(select geom from tokyo_japan_water_coast \
			    union select geom from tokyo_japan_osm_waterareas) as res',
			  	done);
		},
		function(done) {
			renderMap(
			  	['road_styles'],
			  	'(select geom from tokyo_japan_osm_roads where class!=\'railway\') as res',
			  	done);
		},
		function(done) {
			renderMap(
			  	['buildings_styles'],
			  	'(select geom from tokyo_japan_osm_buildings) as res',
			  	done);
		}
	];

	async.series(layers, function(err, layers) {
		if (err) return callback(err);

		console.log("Rendering done, composing final image...");

		composer.compose(layers)
			.then(function(res) {
				res.save(filepath, 'png', function(err) {
					if (err) return callback(err);

					console.log("Written rendered tile to: " + filepath);

					return callback(null);
				});
			})
			.catch(function(err) {
				callback(err);
			});
	});
}

function renderMap(styles, table, done) {
  	var map = new mapnik.Map(TILE_SIZE, TILE_SIZE, proj);
  	var layer = new mapnik.Layer('Layer', proj);

  	map.background			= bgColor;
  	// Needed because width and height of bbox are not equal
  	map.aspect_fix_mode 	= mapnik.Map.ASPECT_RESPECT;
  	map.extent 				= bbox;
  	map.bufferSize			= 0;

  	layer.styles = styles;
  	postgis_settings.table = table;
  	layer.datasource = new mapnik.Datasource(postgis_settings);
  	map.add_layer(layer);

  	map.load('styles/mapnik/stylesheet_light.xml', function(err, map) {
    	if (err) return done(err, null);

	    var im = new mapnik.Image(map.width, map.height);

	    map.render(im, function(err, im) {
      		if (err) return done(err, null);

      		im.premultiply(function(err, img) {
      			if (err) return done(err, null);

      			return done(null, im);
      		});
    	});
  	});
}