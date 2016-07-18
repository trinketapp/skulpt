/**
 * Add document on DOMContentLoaded event
 */
document.addEventListener("DOMContentLoaded", onLoad);
function onLoad(event) {
    window.sense_hat = {
        rtimu: {
            pressure: [1, 1160], /* isValid, pressure*/
            temperature: [1, 25.12], /* isValid, temperature */
            humidity: [1, 45.3], /* isValid, humidity */
            gyro: [0, 0, 0],
            accel: [0, 0, 0],
            compass: [0, 0, 0],
            fusionPose: [0, 0, 0] /* fusionpose, accelerometer */
        },
        sensestick: {}
    }; // create sense_hat value placeholder
    
    /**
     * Handle device orientation changes (actually we should compute the orientation from compass and accelerometer)
     */
    function deviceOrientationChange(deviceOrientation) {
        var deOr = deviceOrientation.toRadians();
        window.sense_hat.rtimu.fusionPose = [
            deOr.beta,
            deOr.gamma,
            deOr.alpha
        ];
    }
    
    // init the deviceOrientationInput, well try to
    try {
        initDeviceOrientationInput(deviceOrientationChange);
    } catch (e) {
        console.error(e);
    }

    // hook up temperature input
    var tempInput = document.getElementById('device-temperature-overide');
    tempInput.addEventListener('input', function (event) {
        event.preventDefault();
        
       var val = event.target.value;
       
       // only numbers/floats are okay
       var isValid = !isNaN(parseFloat(val)) && isFinite(val);
       if (isValid) {
           val = parseFloat(val);
           
           // there are limits:
           //-40 to +120 degrees celsius
           
           Sk.sense_hat.rtimu.temperature = [1, val];
       } else {
           Sk.sense_hat.rtimu.temperature = [0, -1];
       }
    });

    var humidityInput = document.getElementById('device-humidity-overide');
    humidityInput.addEventListener('input', function (event) {
        event.preventDefault();
        
       var val = event.target.value;
       
       // only numbers/floats are okay
       var isValid = !isNaN(parseFloat(val)) && isFinite(val);
       if (isValid) {
           val = parseFloat(val);
           
           
           Sk.sense_hat.rtimu.humidity = [1, val];
       } else {
           Sk.sense_hat.rtimu.humidity = [0, -1];
       }
    });

    /****************************************************************
     * Here starts the skulpt specific stuff, e.g. run/stop btns input, output...
     ****************************************************************/
    // create ace editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    
    var interrupt = false;
    var lowlightLimit = 47;
    
    function interruptHandler() {
        if (interrupt === true) {
            throw new Error('Stopped the hard way!');
        } else {
            return null;
        }
    }
    
    function emit(event, data) {
        //console.info(event, data);
        
        if (event && event === 'setpixel') {
            // change the led
            var ledIndex = data;
            var ledData = window.sense_hat.pixels[ledIndex];
            
            // Convert LED-RGB to RGB565 // and then to RGB555
            var r = ledData[0] & ~7;
            var g = ledData[1] & ~3;
            var b = ledData[2] & ~7;

            // set converted values
            window.sense_hat.pixels[ledIndex] = [r, g, b];

            var led = document.getElementById('e' + ledIndex);
            
            if (ledData[0] > lowlightLimit || ledData[1] > lowlightLimit || ledData[2] > lowlightLimit) {
                var colorVal = "rgb(" + ledData[0] + "," + ledData[1] + "," + ledData[2] + ")";
                led.style.fill = colorVal;
            } else {
                led.style.fill = "#F6F6F6";
            }
        } else if (event && event === 'changeLowlight') {
            if (data === true) {
                lowlightLimit = 8;
            } else {
                lowlightLimit = 47;
            }
        } else if (event && event === 'init') {
            for (var i = 0; i < 64; i++) {
                var ledData = window.sense_hat.pixels[i];
                var led = document.getElementById('e' + i);
                led.style.fill = "#F6F6F6";
                window.sense_hat.pixels[i] = [0, 0, 0]; // reset
            }
        }
    }
    
    var runbtn = document.getElementById('runbtn');
    
    var stopbtn = document.getElementById('stopbtn');
    var output = document.getElementById('output');
    
    stopbtn.addEventListener('click', function (e) {
        interrupt = true;
    });
    
    runbtn.addEventListener('click', function (e) {
        interrupt = false; // reset
        
        function builtinRead(x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
        }
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';

        Sk.configure({ 
            read: builtinRead,
            output: function (val) {
                var newText = output.value + val;
                output.value = newText;
            },
            killableWhile: true
        });
        
        Sk.imageProxy = '';
        Sk.sense_hat = window.sense_hat,
        Sk.sense_hat_emit = emit,

        Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, editor.getValue(), true);
        }, {'*': interruptHandler});
    });
}

function initDeviceOrientationInput(cb) {
    var stageElement = document.querySelector('.orientation-stage');
    var orientationLayer = document.querySelector('.orientation-layer');
    var boxElement = document.querySelector('.orientation-box');
    var resetButton = document.getElementById('device-orientation-reset-button');
    var alphaInput = document.getElementById('device-orientation-override-alpha');
    var betaInput = document.getElementById('device-orientation-override-beta');
    var gammaInput = document.getElementById('device-orientation-override-gamma');
    
    var di = new DeviceOrientation(90, 0, -90);
    
    var elements = {
        stageElement: stageElement,
        boxElement: boxElement,
        orientationLayer: orientationLayer,
        alphaInput: alphaInput,
        betaInput: betaInput,
        gammaInput: gammaInput,
        resetButton: resetButton
    };
    
    var options = {
        deviceOrientation: di,
        onDeviceOrientationChange: cb
    };
    
    var dii = new DeviceOrientationInput(elements, options);
    dii.bindToEvents();
}

// Library for geometry operations
var Geometry = {
    _Eps: 1e-5
};

/**
 * Creates a new Transform matrix (Chrome fu, FireFox fu)
 */
Geometry.Matrix = function () {
    if (window.WebKitCSSMatrix) {
        return new WebKitCSSMatrix();
    } else if (window.DOMMatrix) {
        return new DOMMatrix();
    } else if (window.MSCSSMatrix) {
        // IE10
        return new MSCSSMatrix();
    } else {
        // maybe use Polyfill
        throw Error('Matrix not supported by the browser!');
    }
}

Geometry.Vector = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

Geometry.Vector.prototype = {
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    normalize: function() {
        var length = this.length();
        if (length <= Geometry._Eps)
            return;

        this.x /= length;
        this.y /= length;
        this.z /= length;
    }
}

/**
 * Caclucate angle from 2 vectors
 */
Geometry.calculateAngle = function(u, v) {
    var uLength = u.length();
    var vLength = v.length();
    if (uLength <= Geometry._Eps || vLength <= Geometry._Eps)
        return 0;
    var cos = Geometry.scalarProduct(u, v) / uLength / vLength;
    if (Math.abs(cos) > 1)
        return 0;
    return Geometry.radToDeg(Math.acos(cos));
}

Geometry.degToRad =  function(deg) {
    return deg * Math.PI / 180;
}

Geometry.radToDeg = function(rad) {
    return rad * 180 / Math.PI;
}

Geometry.scalarProduct = function(u, v) {
    return u.x * v.x + u.y * v.y + u.z * v.z;
}

Geometry.crossProduct = function(u, v) {
    var x = u.y * v.z - u.z * v.y;
    var y = u.z * v.x - u.x * v.z;
    var z = u.x * v.y - u.y * v.x;
    return new Geometry.Vector(x, y, z);
}

Geometry.EulerAngles = function(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
}

/**
 * Caclucate euler angles from a rotation matrix
 */
Geometry.EulerAngles.fromRotationMatrix = function(rotationMatrix) {
    var beta = Math.atan2(rotationMatrix.m23, rotationMatrix.m33);
    var gamma = Math.atan2(-rotationMatrix.m13, Math.sqrt(rotationMatrix.m11 * rotationMatrix.m11 + rotationMatrix.m12 * rotationMatrix.m12));
    var alpha = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
    return new Geometry.EulerAngles(Geometry.radToDeg(alpha), Geometry.radToDeg(beta), Geometry.radToDeg(gamma));
}


/**
 * Creates a rotate3d css string based on the euler angles for the css "transform". 
 * 
 * @returns
 */
Geometry.EulerAngles.prototype.toRotate3DString = function () {
    var gammaAxisY = -Math.sin(Geometry.degToRad(this.beta));
    var gammaAxisZ = Math.cos(Geometry.degToRad(this.beta));
    var axis = {
        alpha: [0, 1, 0],
        beta: [-1, 0, 0],
        gamma: [0, gammaAxisY, gammaAxisZ]
    };
    return "rotate3d(" + axis.alpha.join(",") + "," + this.alpha + "deg) " + "rotate3d(" + axis.beta.join(",") + "," + this.beta + "deg) " + "rotate3d(" + axis.gamma.join(",") + "," + this.gamma + "deg)";
}

function DeviceOrientation(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
}

DeviceOrientation.prototype.toRadians = function() {
    return {
        alpha: Geometry.degToRad(this.alpha),
        beta: Geometry.degToRad(this.beta),
        gamma: Geometry.degToRad(this.gamma)
    }
}

/**
 * Validate user input, returns DeviceOrientation or null
 */
DeviceOrientation.parseUserInput = function (alphaString, betaString, gammaString) {
    function isUserInputValid(value) {
        if (!value)
            return true;
        return /^[-]?[0-9]*[.]?[0-9]*$/.test(value);
    }

    if (!alphaString && !betaString && !gammaString) {
        return null;
    }

    var isAlphaValid = isUserInputValid(alphaString);
    var isBetaValid = isUserInputValid(betaString);
    var isGammaValid = isUserInputValid(gammaString);

    if (!isAlphaValid && !isBetaValid && !isGammaValid) {
        return null;
    }

    var alpha = isAlphaValid ? parseFloat(alphaString) : -1;
    var beta = isBetaValid ? parseFloat(betaString) : -1;
    var gamma = isGammaValid ? parseFloat(gammaString) : -1;

    return new DeviceOrientation(alpha, beta, gamma);
}

/**
 * DeviceOrientationInput class
 */
function DeviceOrientationInput(elements, options) {
    this._stageElement = elements.stageElement;
    this._orientationLayer = elements.orientationLayer;
    this._boxElement =  elements.boxElement;
    this._alphaElement =  elements.alphaInput;
    this._betaElement =  elements.betaInput;
    this._gammaElement =  elements.gammaInput;
    
    this._resetButton =  elements.resetButton;
    
    this._boxMatrix;
    this._currentMatrix;
    this._isDragging = false;
    
    var deviceOrientation;
    if (options && options.deviceOrientation && options.deviceOrientation instanceof DeviceOrientation) {
        deviceOrientation = options.deviceOrientation;
    } else {
        deviceOrientation = new DeviceOrientation(0, 90, 0);
    }
    
    this.options = options;
    
    this._setDeviceOrientation(deviceOrientation, 'InitialInput');
}

DeviceOrientationInput.getEventX = function(event) {
    if (event.x) {
        return event.x;
    }
    
    if (event.clientX) {
        return event.clientX;
    }
}

DeviceOrientationInput.getEventY = function(event) {
    if (event.y) {
        return event.y;
    }
    
    if (event.clientY) {
        return event.clientY;
    }
}

DeviceOrientationInput.prototype.bindToEvents = function() {
    this._dragHandle();
    this._resetButton.addEventListener('click', this._resetDeviceOrientation.bind(this));
    
    this._alphaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._betaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._gammaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
}

DeviceOrientationInput.prototype._dragHandle = function() {
    function isMac() {
        return navigator.platform === 'MacIntel' || navigator.platform === 'MacPPC' || navigator.platform === 'Mac68K';
    }

    function mouseDownHandler(event) {
        // Only drag upon left button, not on right button or context menu clicks
        if (event.button || (isMac() && event.ctrlKey))
            return;
            
        // can this happen?
        if (this._isDragging === true) {
            console.info('mousedown while isDragging is true');
            return;
        }

        if (this._dragPane) {
            if (this._dragPane.parentNode)
                this._dragPane.parentNode.removeChild(this._dragPane);
            
            this._dragPane.remove();
            delete this._dragPane;
        }
        
        this._isDragging = true
        this._onBoxDragStart(event);

        // create pane and register to events
        createDragPane.apply(this);
        console.info('dragpane created');
        
        if (this._dragPane != null) {
            // register events
            this._dragPane.addEventListener('mousemove', mouseMoveHandler.bind(this));    
            this._dragPane.addEventListener('touchmove', mouseMoveHandler.bind(this));  

            this._dragPane.addEventListener('mouseup', mouseUpHandler.bind(this));
            this._dragPane.addEventListener('touchend', mouseUpHandler.bind(this));

            this._dragPane.addEventListener('mouseout', event => {
                console.info('mouseout', event)
                mouseUpHandler.call(this, event);
            });
            this._dragPane.addEventListener('touchcancel', mouseUpHandler.bind(this));
        }    
    }
    
    function mouseMoveHandler(event) {
        if (this._isDragging === true) {
            //event.preventDefault();
            this._onBoxDrag(event);
            console.info('mousemove');
        }
    }
    
    function mouseUpHandler(event) {
        event.preventDefault();
        
        this._isDragging = false;
        this._onBoxDragEnd(event);
        console.info('mouseup', event);
        // clean up dragPane
        if (this._dragPane) {
            if (this._dragPane.parentNode)
                this._dragPane.parentNode.removeChild(this._dragPane);
            
            this._dragPane.remove();
            delete this._dragPane;
        }
    }
     
    function createDragPane() {
        this._dragPane = document.createElement("div");
        this._dragPane.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;background-color:transparent;z-index:3000;overflow:hidden;";
        this._dragPane.id = "drag-pane";
        document.body.appendChild(this._dragPane);
        
        /*
        function handlePaneOut(event) {
            mouseUpHandler.apply(this, event);
        }

        this._dragPane.addEventListener('mouseout', handlePaneOut.bind(this));
        this._dragPane.addEventListener('touchcancel', handlePaneOut.bind(this));
        */
    }
    
    this._stageElement.addEventListener('mousedown', mouseDownHandler.bind(this));    
    this._stageElement.addEventListener('touchstart', mouseDownHandler.bind(this));    
}

/**
 * Calculate radius vector after dragging
 */
DeviceOrientationInput.prototype._calculateRadiusVector = function (x, y) {
    var rect = this._stageElement.getBoundingClientRect();
    var radius = Math.max(rect.width, rect.height) / 2;
    var sphereX = (x - rect.left - rect.width / 2) / radius;
    var sphereY = (y - rect.top - rect.height / 2) / radius;
    var sqrSum = sphereX * sphereX + sphereY * sphereY;
    if (sqrSum > 0.5)
        return new Geometry.Vector(sphereX,sphereY,0.5 / Math.sqrt(sqrSum));
    return new Geometry.Vector(sphereX,sphereY,Math.sqrt(1 - sqrSum));
};

DeviceOrientationInput.prototype._onBoxDragEnd = function() {
    //this._boxMatrix = this._currentMatrix;
};

DeviceOrientationInput.prototype._onBoxDragStart = function (event) {
    this._mouseDownVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));
    this._originalBoxMatrix = this._boxMatrix;

    if (!this._mouseDownVector)
        return false;

    event.preventDefault();
    return true;
};

DeviceOrientationInput.prototype._onBoxDrag = function(event) {
    var mouseMoveVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));
    if (!mouseMoveVector)
        return true;

    event.preventDefault();

    var axix;
    var angle;

    //if (event.shiftKey) {
    //    axis = new Geometry.Vector(0, 0, -1);
    //    angle = (this._mouseDownVector.x - mouseMoveVector.x) * 16;
    //} else {
        axis = Geometry.crossProduct(this._mouseDownVector, mouseMoveVector);
        angle = Geometry.calculateAngle(this._mouseDownVector, mouseMoveVector);
    //}

    var currentMatrix = Geometry.Matrix(); // Returns a new Matrix Browser independent
    currentMatrix = currentMatrix.rotate(-90, 0, 0).rotateAxisAngle(axis.x, axis.y, axis.z, angle).rotate(90, 0, 0).multiply(this._originalBoxMatrix);
    var eulerAngles = Geometry.EulerAngles.fromRotationMatrix(currentMatrix);
    var newOrientation = new DeviceOrientation(-eulerAngles.alpha, -eulerAngles.beta, eulerAngles.gamma);
     
    this._setDeviceOrientation(newOrientation, "UserDrag");
    return false;
};

/**
 * Update the draggable box position after user input
 */
DeviceOrientationInput.prototype._setBoxOrientation = function(deviceOrientation) {
    var matrix = Geometry.Matrix();
    
    this._boxMatrix = matrix.rotate(-deviceOrientation.beta, deviceOrientation.gamma, -deviceOrientation.alpha);
    
    var eulerAngles = new Geometry.EulerAngles(deviceOrientation.alpha, deviceOrientation.beta, deviceOrientation.gamma);

    var matrixString = eulerAngles.toRotate3DString();
    this._orientationLayer.style.webkitTransform = matrixString;
    this._orientationLayer.style.mozTransform = matrixString;
    this._orientationLayer.style.transform = matrixString;
};

/**
 * Handle user input
 */
DeviceOrientationInput.prototype._applyDeviceOrientationUserInput = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(DeviceOrientation.parseUserInput(this._alphaElement.value.trim(), this._betaElement.value.trim(), this._gammaElement.value.trim()), "UserInput");
}

/**
 * Resets the orientation to (90, 0, -90)
 */
DeviceOrientationInput.prototype._resetDeviceOrientation = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(new DeviceOrientation(90, 0, -90), "ResetButton");
}

/**
 * Sets the device orientation after a change
 */
DeviceOrientationInput.prototype._setDeviceOrientation = function(deviceOrientation, modificationSource) {
    if (!deviceOrientation)
        return;
    
    function roundAngle(angle) {
        return (Math.round(angle * 10000) / 10000) % 361; // round module 361 to get values between 0 and 360
    }

    if (modificationSource != "UserInput") {
        this._alphaElement.value = roundAngle(deviceOrientation.alpha);
        this._betaElement.value = roundAngle(deviceOrientation.beta);
        this._gammaElement.value = roundAngle(deviceOrientation.gamma);
    }

    this._setBoxOrientation(deviceOrientation);

    if (this.options && this.options.onDeviceOrientationChange) {
        this.options.onDeviceOrientationChange.call(null, deviceOrientation);
    }
};