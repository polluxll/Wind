// using var to work around a WebKit bug

var projection = ol.proj.get('EPSG:4326');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = [];
var matrixIds = [];
for (var z = 1; z <= 19; z++) {
    resolutions.push(size / Math.pow(2, z));
    matrixIds.push(z);
}
var map = new ol.Map({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: 'http://t{0-6}.tianditu.com/vec_c/wmts',
                layer: 'vec',
                matrixSet: 'c',
                format: 'tiles',
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projectionExtent),
                    resolutions: resolutions,
                    matrixIds: matrixIds
                }),
                style: 'default'
            })
        }),
        new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: 'http://t{0-6}.tianditu.com/cva_c/wmts',
                layer: 'cva',
                matrixSet: 'c',
                format: 'tiles',
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projectionExtent),
                    resolutions: resolutions,
                    matrixIds: matrixIds
                }),
                style: 'default'
            })
        })
    ],
    target: 'map',
    logo: false,
    //renderer:'webgl',
    view: new ol.View({
        projection: projection,
        center: [115.00228, 25.14696],
        zoom: 4,
        maxZoom: 15,
        minZoom: 1
    })
});



var canvas = document.getElementById('canvas');

const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const gl = canvas.getContext('webgl', { antialiasing: false });

const wind = window.wind = new WindGL(gl);
wind.numParticles = 65536;
//wind.numParticles = 589824;

const gui = new dat.GUI();
gui.add(wind, 'numParticles', 1024, 589824);
gui.add(wind, 'fadeOpacity', 0.7, 0.999).step(0.001).updateDisplay();
gui.add(wind, 'speedFactor', 0.05, 1.0);
gui.add(wind, 'dropRate', 0, 0.1);
gui.add(wind, 'dropRateBump', 0, 0.2);

var load = false;
var windData;
getJSON('wind/2016112000.json', function(data) {
    windData = data;
    load = true;
});


map.on('postrender',function(event){
    if(wind.windData){
        wind.resetWindTexture();
    }
});


function frame() {

    if (wind.windData) {
        wind.draw();
    }
    requestAnimationFrame(frame);
    if (load) {
        updateWind();
    }
}
frame();


//updateRetina();

function updateRetina() {
    const ratio = 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    wind.resize();
}


function updateWind(name) {
    load = false;
    const windImage = new Image();
    windData.image = windImage;
    windImage.src = 'wind/1.png?';
    windImage.onload = function() {
        wind.setWind(windData);
        load = true;
    };
}

function getJSON(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('get', url, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(xhr.response);
        } else {
            throw new Error(xhr.statusText);
        }
    };
    xhr.send();
}
