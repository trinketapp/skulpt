/**
 * Internal SenseHat Module for reading and writing values from
 * JavaScript World to the Python World. This modules set ups
 * the commmunication and allows to read and write pixels. If the
 * "Sk.sense_hat_emit" config is present, we emit events when
 * values are changed: Python -> JavaScript
 */
var $builtinmodule = function (name) {
    var mod = {};
    
    mod.init = new Sk.builtin.func(function () {
        // check if the pixels array does already exist and or create it
        if(!Sk.sense_hat) {
            throw new Error('SenseHat Browser storage must be set: Sk.sense_hat must exist');
        }
        
        // create 64 (8x8) empty array for the leds
        if (!Sk.sense_hat.pixels) {
            Sk.sense_hat.pixels = [];
        }
        
        if (!Sk.sense_hat.low_light) {
            Sk.sense_hat.low_light = false;
        }
        
        // gamma is stored as a 32 bit value (so should we store it as a number or array?)
        if (!Sk.sense_hat.gamma) {
            Sk.sense_hat.gamma = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // lookup table (@see https://pythonhosted.org/sense-hat/api/#gamma)
        }
        
        // Sensor stuff, all reads should never fail
        if (!Sk.sense_hat.rtimu) {
            Sk.sense_hat.rtimu = {
                pressure: [1, 0], /* isValid, pressure*/
                temperature: [1, 0], /* isValid, temperature */
                humidity: [1, 0], /* isValid, humidity */
                gyro: [0, 0, 0],
                accel: [0, 0, 0],
                compass: [0, 0, 0],
                fusionPose: [0, 0, 0]
            }
        }
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('init');
        }
    });
    
    // _fb_device specific methods
    mod.setpixel = new Sk.builtin.func(function (index, value) {
        var _index;
        var _value;
        
        _index = Sk.ffi.remapToJs(index);
        _value = Sk.ffi.remapToJs(value);
        
        try {
            Sk.sense_hat.pixels[_index] = _value;
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }

        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setpixel', _index);
        }
    });

    mod.getpixel = new Sk.builtin.func(function (index) {
        var value;
        var _index;
        var _value;
        
        _index = Sk.ffi.remapToJs(index);
        
        try {
            _value = Sk.sense_hat.pixels[_index];
            value = Sk.ffi.remapToPy(_value); // should return a list
            //value = new Sk.builtin.list(value);
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        return value;
    });

    mod.setpixels = new Sk.builtin.func(function (values) {
        _values = Sk.ffi.remapToJs(values);
        
        try {
            Sk.sense_hat.pixels = _values;
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setpixels');
        }
    });

    mod.getpixels = new Sk.builtin.func(function () {
        var values;
        
        try {
            values = Sk.ffi.remapToPy(Sk.sense_hat.pixels); // should return a list
            values = new Sk.builtin.list(values);
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        return values;
    });

    mod.getGamma = new Sk.builtin.func(function () {
        var gamma = Sk.ffi.remapToPy(Sk.sense_hat.gamma);
        return gamma;
    });

    mod.setGamma = new Sk.builtin.func(function (gamma) {
        // checks are made in fb_device.py
        var _gamma = Sk.ffi.remapToJs(gamma);
        Sk.sense_hat.gamma = _gamma;
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setGamma');
        }
    });

    mod.setLowlight = new Sk.builtin.func(function (value) {
        var _value = Sk.ffi.remapToJs(value);
        
        Sk.sense_hat.low_light = _value;
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('changeLowlight', _value);
        }
    });

    // RTIMU stuff
    mod.pressureRead = new Sk.builtin.func(function () {
        var dataArray = [].concat(Sk.sense_hat.rtimu.pressure, Sk.sense_hat.rtimu.temperature);
        var _dataArray = Sk.ffi.remapToPy(dataArray);
        var data = new Sk.builtin.tuple(_dataArray);
        
        return data;
    });
    
    mod.humidityRead = new Sk.builtin.func(function () {
        var dataArray = [].concat(Sk.sense_hat.rtimu.humidity, Sk.sense_hat.rtimu.temperature);
        var _dataArray = Sk.ffi.remapToPy(dataArray);
        var data = new Sk.builtin.tuple(_dataArray);
        
        return data;
    });

    mod.temperatureRead = new Sk.builtin.func(function () {
        var temperature = Sk.ffi.remapToPy(Sk.sense_hat.rtimu.temperature);
        
        return temperature;
    });

    return mod;
};