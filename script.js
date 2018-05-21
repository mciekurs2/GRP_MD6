// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMjRmNGY1Yy1iNDM4LTQ5OGQtOGE0OC0zN2Y1NjA0YWJhNjAiLCJpZCI6MTA3MywiaWF0IjoxNTI2OTI2MTEyfQ.9vqIeKwacZICqW5ZHEuJ7bPh5tHZsrvZt90OQgN9R_w';

/*Nodefinee papildus funkcionalitāti*/
var viewer = new Cesium.Viewer('cesiumContainer', {
    scene3DOnly: true,
    selectionIndicator: false,
    baseLayerPicker: true,
    shouldAnimate : true //priekš animācijām
});

var mezi = new Cesium.ImageryLayer((new Cesium.WebMapServiceImageryProvider({
    url : 'http://lvmgeoserver.lvm.lv/geoserver/ows',
    credit : 'Latvijas valsts meži',
    layers: 'public:Orto_LKS'
})));
viewer.imageryLayers.add(mezi);

viewer.terrainProvider = Cesium.createWorldTerrain({
    requestWaterMask : true, // required for water effects
    requestVertexNormals : true // required for terrain lighting
});

viewer.scene.globe.depthTestAgainstTerrain = true;



var scene = viewer.scene;
scene.debugShowFramesPerSecond = true;

Cesium.Math.setRandomNumberSeed(315);

var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(24, 57));
var emitterInitialLocation = new Cesium.Cartesian3(0, 0, 1000);

var particleCanvas;

function getImage() {
    if (!Cesium.defined(particleCanvas)) {
        particleCanvas = document.createElement('canvas');
        particleCanvas.width = 20;
        particleCanvas.height = 20;
        var context2D = particleCanvas.getContext('2d');
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = 'rgb(255, 255, 255)';
        context2D.fill();
    }
    return particleCanvas;
}

var minimumExplosionSize = 100000;
var maximumExplosionSize = 1000000;
var particlePixelSize = new Cesium.Cartesian2(10, 7.0);
var burstSize = 400;
var lifetime = 10;
var numberOfFireworks = 20.0;

var emitterModelMatrixScratch = new Cesium.Matrix4();


//kameras atrašanās vieta
var center = Cesium.Cartesian3.fromDegrees(24, 57);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0, 0, 4200.0));

function createFirework(offset, color, bursts) {
    var position = Cesium.Cartesian3.add(emitterInitialLocation, offset, new Cesium.Cartesian3());
    var emitterModelMatrix = Cesium.Matrix4.fromTranslation(position, emitterModelMatrixScratch);
    var particleToWorld = Cesium.Matrix4.multiply(modelMatrix, emitterModelMatrix, new Cesium.Matrix4());
    var worldToParticle = Cesium.Matrix4.inverseTransformation(particleToWorld, particleToWorld);

    var size = Cesium.Math.randomBetween(minimumExplosionSize, maximumExplosionSize);
    var particlePositionScratch = new Cesium.Cartesian3();
    var force = function(particle) {
        var position = Cesium.Matrix4.multiplyByPoint(worldToParticle, particle.position, particlePositionScratch);
        if (Cesium.Cartesian3.magnitudeSquared(position) >= size * size) {
            Cesium.Cartesian3.clone(Cesium.Cartesian3.ZERO, particle.velocity);
        }
    };

    var normalSize = (size - minimumExplosionSize) / (maximumExplosionSize - minimumExplosionSize);
    var minLife = 0.3;
    var maxLife = 1.0;
    var life = normalSize * (maxLife - minLife) + minLife;

    scene.primitives.add(new Cesium.ParticleSystem({
        image : getImage(),
        startColor : color,
        endColor : color.withAlpha(0.0),
        particleLife : life,
        speed : 100.0,
        imageSize : particlePixelSize,
        emissionRate : 0,
        emitter : new Cesium.SphereEmitter(0.1),
        bursts : bursts,
        lifetime : lifetime,
        updateCallback : force,
        modelMatrix : modelMatrix,
        emitterModelMatrix : emitterModelMatrix
    }));
}

var xMin = -100.0;
var xMax = 100.0;
var yMin = -80.0;
var yMax = 100.0;
var zMin = -50.0;
var zMax = 50.0;

var colorOptions = [{
    minimumRed : 0.75,
    green : 0.0,
    minimumBlue : 0.8,
    alpha : 1.0
}, {
    red : 0.0,
    minimumGreen : 0.75,
    minimumBlue : 0.8,
    alpha : 1.0
}, {
    red : 0.0,
    green : 0.0,
    minimumBlue : 0.8,
    alpha : 1.0
}, {
    minimumRed : 0.75,
    minimumGreen : 0.75,
    blue : 0.0,
    alpha : 1.0
}];

for (var i = 0; i < numberOfFireworks; ++i) {
    var x = Cesium.Math.randomBetween(xMin, xMax);
    var y = Cesium.Math.randomBetween(yMin, yMax);
    var z = Cesium.Math.randomBetween(zMin, zMax);
    var offset = new Cesium.Cartesian3(x, y, z);
    var color = Cesium.Color.fromRandom(colorOptions[i % colorOptions.length]);

    var bursts = [];
    for (var j = 0; j < 3; ++j) {
        bursts.push(new Cesium.ParticleBurst({
            time : Cesium.Math.nextRandomNumber() * lifetime,
            minimum : burstSize,
            maximum : burstSize
        }));
    }

    createFirework(offset, color, bursts);
}




