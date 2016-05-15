import _internal_sense_hat as _isa

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
        
        _isa.init()
        _isa.setpixels(self.data)

    def seek(self, offset, whence=0):
        """
        The offset is basically the index in our internal list of RGB entries
        :param offset:
        :param whence:
        :return:
        """
        if whence == 0:
            # seek from start of file
            self.index = offset
        elif whence == 1:
            # to current position
            if offset != 0:
                raise ValueError('"offset" must be zero if seeking to current position')
        elif whence == 2:
            if offset != 0:
                raise ValueError('"offset" must be zero if seeking to end position')
            self.index = len(self.data) - 1
        else:
            raise ValueError('invalid value for argument "whence"')

    def write(self, t):
        print('FBDevice:write index=', self.index, t)
        self.data[self.index] = t

    def tell(self):
        return self.index # transform back to bytes

    def read(self, count):
        # ignore basically count, we only return items
        data = self.data[self.index]

        # update position
        self.index += count
        return data

    def close(self):
        pass

    def ioctl(self, request, arg=0, mutate_flag=True):
        if addr == FBDevice.SENSE_HAT_FB_FBIOGET_GAMMA:
            # mimic the function behavior
            for i in range(0, len(arg)):
                arg[i] = self.gamma[i]
        elif request == FBDevice.SENSE_HAT_FB_FBIOSET_GAMMA:
            if len(arg) != 32:
                raise OSError('Setting gamma requires 32 values')
            self.gamma = list(arg)
        elif request == FBDevice.SENSE_HAT_FB_FBIORESET_GAMMA:
            self.gamma = [arg]*32

        else:
            # ToDo: check if we need to todo this
            raise OSError('Unsupported operation')

        return 0