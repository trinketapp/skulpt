import _internal_sense_hat as _ish

"""
    Custom fb_device implementation that stubs the file descriptor hardware access
"""

class FBDevice:
    SENSE_HAT_FB_FBIOGET_GAMMA = 61696
    SENSE_HAT_FB_FBIOSET_GAMMA = 61697
    SENSE_HAT_FB_FBIORESET_GAMMA = 61698

    def __init__(self):
        self.data = [[0, 0, 0] for i in range(0, 64)] # we store the data as 8x8=64 items
        self.index = 0
        self.gamma = [0]*32

        _ish.init()
        _ish.setpixels(self.data)

    def setpixel(self, index, value):
        _ish.setpixel(index, value)

    def getpixel(self, index):
        return _ish.getpixel(index)

    def setpixels(self, values):
        _ish.setpixels(values)

    def getpixels(self):
        return _ish.getpixels()

    def ioctl(self, request, arg=0, mutate_flag=True):
        if request == FBDevice.SENSE_HAT_FB_FBIOGET_GAMMA:
            # mimic the function behavior
            if len(arg) != 32:
                raise OSError('Getting gamma requires a buffer for 32 values')

            gamma = _ish.getGamma()
            
            for i in range(0, len(arg)):
                arg[i] = gamma[i]
        elif request == FBDevice.SENSE_HAT_FB_FBIOSET_GAMMA:
            if len(arg) != 32:
                raise OSError('Setting gamma requires 32 values')
            _ish.setGamma(arg)
            # ToDo: add checks if we might need to set low_light
        elif request == FBDevice.SENSE_HAT_FB_FBIORESET_GAMMA:
            #self.gamma = [arg]*32
            # special case
            if arg == 1:
                _ish.setGamma([0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 10])
                _ish.setLowlight(True)
            elif arg == 0:
                _ish.setGamma([0]*32)
                _ish.setLowlight(False)
        else:
            # ToDo: check if we need to todo this
            raise OSError('Unsupported operation')

        return 0
