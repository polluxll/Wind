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
        zoom: 3,
        maxZoom: 15,
        minZoom: 0
    })
});

var fullExtent = [47.1227, -16.35261, 164.6227, 60.39739];


var imageTransform = [1, 0, 0, 1, 0, 0];
var size = [1920, 947];
var imgExtent = [470, 307];
var pixelRatio = 1;
var imagePixelRatio = 1;

var imageResolution = (fullExtent[3] - fullExtent[1]) / imgExtent[1];
var viewResolution = map.getView().getResolution();
var scale = pixelRatio * imageResolution / (viewResolution * imagePixelRatio);


var viewCenter = map.getView().getCenter();
var transform = transformCompose(imageTransform,
    pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
    scale, scale,
    0,
    imagePixelRatio * (fullExtent[0] - viewCenter[0]) / imageResolution,
    imagePixelRatio * (viewCenter[1] - fullExtent[3]) / imageResolution);


var dx = Math.round(transform[4]);
var dy = Math.round(transform[5]);
var dw = Math.round(imgExtent[0] * transform[0]);
var dh = Math.round(imgExtent[1] * transform[3]);
var x0 = dx / size[0];
var y0 = dy / size[1];
var x1 = (dx + dw) / size[0];
var y1 = (dy + dh) / size[1];


var mapCanvas = map.getViewport().children[0];
var mapContext = mapCanvas.getContext('2d');




//var canvas = map.getViewport().children[0]; // eslint-disable-line
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
gui.add(wind, 'fadeOpacity', 0.9, 0.999).step(0.001).updateDisplay();
gui.add(wind, 'speedFactor', 0.05, 1.0);
gui.add(wind, 'dropRate', 0, 0.1);
gui.add(wind, 'dropRateBump', 0, 0.2);

var load = false;
var windData;
getJSON('wind/2016112000.json', function(data) {
    windData = data;
    load = true;
});



function frame() {

    var imageResolution = (fullExtent[3] - fullExtent[1]) / imgExtent[1];
    var viewResolution = map.getView().getResolution();
    var scale = pixelRatio * imageResolution / (viewResolution * imagePixelRatio);

    var viewCenter = map.getView().getCenter();
    var transform = transformCompose(imageTransform,
        pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
        scale, scale,
        0,
        imagePixelRatio * (fullExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - fullExtent[3]) / imageResolution);


    var dx = Math.round(transform[4]);
    var dy = Math.round(transform[5]);
    var dw = Math.round(imgExtent[0] * transform[0]);
    var dh = Math.round(imgExtent[1] * transform[3]);
    x0 = dx / size[0];
    y0 = dy / size[1];
    x1 = (dx + dw) / size[0];
    y1 = (dy + dh) / size[1];

    mapContext.lineWidth = 2;
    mapContext.beginPath();
    mapContext.strokeStyle = "red";
    var circle1 = {
        x: Math.round(x0 * canvas.clientWidth),
        y: Math.round(y0 * canvas.clientHeight),
        r: 5
    };
    mapContext.arc(circle1.x, circle1.y, circle1.r, 0, Math.PI * 2, false);
    mapContext.stroke();
    mapContext.beginPath();
    mapContext.strokeStyle = "green";
    var circle2 = {
        x: Math.round(x0 * canvas.clientWidth),
        y: Math.round(y1 * canvas.clientHeight),
        r: 5
    };
    mapContext.arc(circle2.x, circle2.y, circle2.r, 0, Math.PI * 2, false);
    mapContext.stroke();
    mapContext.beginPath();
    mapContext.strokeStyle = "blue";
    var circle3 = {
        x: Math.round(x1 * canvas.clientWidth),
        y: Math.round(y0 * canvas.clientHeight),
        r: 5
    };
    mapContext.arc(circle3.x, circle3.y, circle3.r, 0, Math.PI * 2, false);
    mapContext.stroke();
    mapContext.beginPath();
    mapContext.strokeStyle = "black";
    var circle4 = {
        x: Math.round(x1 * canvas.clientWidth),
        y: Math.round(y1 * canvas.clientHeight),
        r: 5
    };
    mapContext.arc(circle4.x, circle4.y, circle4.r, 0, Math.PI * 2, false);
    mapContext.stroke();

    if (wind.windData) {
        wind.draw();
    }
    requestAnimationFrame(frame);
    if (load) {
        updateWind(t);
    }
}
frame();

map.on('postrender',function(){
    //wind.resize();
});

function transformCompose(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    transform[0] = sx * cos;
    transform[1] = sy * sin;
    transform[2] = -sx * sin;
    transform[3] = sy * cos;
    transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
    transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
    return transform;
}

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
    var unixTime = (new Date().getTime() / 1000).toFixed(0);
    windImage.src = 'wind/' + name + '.png?' + unixTime;
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
