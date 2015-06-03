var $builtinmodule = function (name) {
  var mod = {};

  var permutator = function (arr, r) {
    var result = [];
    if (arr.length == 1) {
      return [arr];
    }

    for (var i = 0; i < arr.length; i++) {
      var sub = permutator(arr.slice(0, i).concat(arr.slice(i + 1)));
      for (var j = 0; j < sub.length; j++) {
        sub[j].unshift(arr[i]);
        result.push(sub[j]);
      }
    }

    return result;
  };

  var permutations_f = function (iterable) {
    var arr = Sk.ffi.remapToJs(iterable);
    var permutations = permutator(arr), i;

    for (i = 0; i < permutations.length; i++) {
      permutations[i] = Sk.builtin.tuple(permutations[i]);
    }

    return Sk.builtin.makeGenerator(function () {
      if (this.$index >= this.$permutations.length) {
        return undefined;
      }
      return this.$permutations[this.$index++];
    }, {
      $obj: this,
      $index: 0,
      $permutations: permutations
    });
  }

  mod.permutations = new Sk.builtin.func(permutations_f);

  return mod;
};
