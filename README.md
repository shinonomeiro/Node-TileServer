# Node-TileServer
Simple tile server powered by OpenStreetMap and mapnik. 

Environment: up to Node 4.x (mapnik seemingly incompatible with newer versions)

## Usage

Navigate to the directory and execute from shell:
```shell
$ node app.js
```
The server will start listening on port 3000. The rendering of new tiles may takes significant time as the data is pulled from an AWS RDS micro instance with limited computing power. A few sample pre-rendered tiles are provided under the /tiles folder.

### Download a sample tile

```
http://localhost:3000/location/17/116400/79448.png
```

In the link above, 17 is the zoom level, 116400 is the tile horizontal position from the left and 79448 its vertical position from the bottom on a Web Mercator projection. The total number of tiles in both directions is 1 << 17 or 2^17.
