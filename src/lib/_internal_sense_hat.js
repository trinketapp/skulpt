var $builtinmodule = function (name) {
    var mod = {};
    
    mod.init = new Sk.builtin.func(function () {
        // check if the pixels array does already exist and or create it
        if(!Sk.sense_hat) {
            Sk.sense_hat = {};
        }
        
        // create 64 (8x8) empty array for the leds
        if (!Sk.sense_hat.pixels) {
            Sk.sense_hat.pixels = [];
        }
        
        if (!Sk.sense_hat.isHighGamma) {
            
        }
        
        // gamma is stored as a 32 bit value (so should we store it as a number or array?)
        if (!Sk.sense_hat.gamma) {
            Sk.sense_hat.gamma = []; // lookup table (@see https://pythonhosted.org/sense-hat/api/#gamma)
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
            Sk.sense_hat_emit('setpixel', index);
        }
    });

    mod.getpixel = new Sk.builtin.func(function (index) {
        var value;
        var _index;
        var _value;
        
        _index = Sk.ffi.remapToJs(index);
        
        try {
            _value = Sk.sense_hat.pixels[_index] = _value;
            value = Sk.ffi.remapToPy(_value); // should return a list
            value = new Sk.builtin.list(value);
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
        
    });

    mod.setGamma = new Sk.builtin.func(function () {
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setGamma');
        }
    });

    mod.resetGamma = new Sk.builtin.func(function () {
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('resetGamma');
        }
    });

    // RTIMU stuff
    mod.pressureRead = new Sk.builtin.func(function () {
        
    });
    
    mod.humidityRead = new Sk.builtin.func(function () {
        
    });

    mod.temperatureRead = new Sk.builtin.func(function () {
        
    });

    return mod;
};