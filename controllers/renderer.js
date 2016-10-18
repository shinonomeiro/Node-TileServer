const async 		= require('async');
const mapnik 		= require('mapnik');
const sha256 		= require('js-sha256');
const fs 			= require('fs');
const path 			= require('path');

const geohelpers	= require('./geohelpers');
const compositor 	= require('./compositor');

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

var proj      	= '+init=epsg:3857'; // Web Mercator projection
var bgColor   	= new mapnik.Color("transparent");

exports.renderTile = function(tile, filepath, callback) {
	var bbox = geohelpers.computeTileBbox(tile);
	var hash = sha256(`x:${tile.x}y:${tile.y}zoom:${tile.zoom}`);

	console.log('Rendering tile layers with mapnik...');
	console.log('Bbox: ' + bbox);

	// PARALLEL //

	async.parallel([
		function(done) {
			renderMap(
				bbox,
			  	['land_styles'],
			  	'(select geom from tokyo_japan_land_coast) as res',
			  	hash + '_land.png',
			  	done);
		},
		function(done) {
			renderMap(
				bbox,
			  	['water_styles'],
			  	'(select geom from tokyo_japan_water_coast \
			    union select geom from tokyo_japan_osm_waterareas) as res',
			  	hash + '_water.png',
			  	done);
		},
		function(done) {
			renderMap(
				bbox,
			  	['road_styles'],
			  	'(select geom from tokyo_japan_osm_roads where class!=\'railway\') as res',
			  	hash + '_roads.png',
			  	done);
		},
		function(done) {
			renderMap(
				bbox,
			  	['buildings_styles'],
			  	'(select geom from tokyo_japan_osm_buildings) as res',
			  	hash + '_buildings.png',
			  	done);
		}
	],

	// Once all parallel tasks are done

	function(err, pathList) {
		if (err) return callback(err);

		console.log("Rendering done, compositing final image...");

		compositor.compose(pathList, function(err, img) {
			if (err) return callback(err);

			console.log('Successfully composited image');

			// FIXME //

			console.log("Cleaning up...");

    		for (var i = 0; i < pathList.length; i++) {
    			fs.unlink(pathList[i], function(err) {
    				// TODO
    			});
    		}

   			// //

			img.write(filepath, function(err) {
				if (err) return callback(err);

				console.log("Written rendered tile to: " + filepath);

				return callback(err);
			});
		});
	});

	// END OF PARALLEL //
}

function renderMap(bbox, styles, table, filename, done) {
  	var map = new mapnik.Map(TILE_SIZE, TILE_SIZE, proj);
  	var layer = new mapnik.Layer('Layer', proj);

  	map.background			= bgColor;
  	// Needed, since width and height of bbox are not equal because of distortion
  	map.aspect_fix_mode 	= mapnik.Map.ASPECT_RESPECT;
  	map.extent 				= bbox;
  	map.bufferSize			= 0;

  	layer.styles = styles;
  	postgis_settings.table = table;
  	layer.datasource = new mapnik.Datasource(postgis_settings);
  	map.add_layer(layer);

  	console.log('Rendering ' + filename);

  	map.load('styles/mapnik/stylesheet_light.xml', function(err, map) {
    	if (err) return done(err, null);

	    var im = new mapnik.Image(map.width, map.height);

	    map.render(im, function(err, im) {
      		if (err) return done(err, null);

      		console.log('Done: ' + filename);
      		var targetPath = path.join('tiles/renders', filename);

      		im.save(targetPath, 'png', function(err) {
        		if (err) return done(err, null);

        		console.log('Saved layer to raster image ' + targetPath);

        		return done(err, targetPath);
      		});
    	});
  	});
}