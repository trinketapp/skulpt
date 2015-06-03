# var $builtinmodule = function (name) {
#     var mod = {};

#     var permutations_f = function(iterable, r) {
#         var list     = Sk.ffi.remapToJs(iterable),
#             n        = list.length,
#             indices  = [],
#             cycles   = [],
#             res      = [],
#             i, j,swap;

#         r = r === Sk.builtin.none.none$ ? n : Sk.builtin.asnum$(r);
        
#         for (i = 0; i < n; i++) {
#             indices[i] = i;
#         }
#         for (i = n+1; --i >= n-r+1;) {
#             cycles.push(i);
#         }

#         var genResult = function() {
#             return indices.map(function(v) { return list[v] });
#         };

#         return Sk.builtin.makeGenerator(function () {
#             if (this.$first) {
#                 this.$first = false;
#                 return genResult();
#             }

#             for (i = r; --i >= 0;) {
#                 cycles[i] -= 1;
#                 if (cycles[i] === 0) {
#                     indices = indices.slice(0,i).concat(indices.slice(i+1), indices.slice(i,i+1));
#                     cycles[i] = n - i;
#                 }
#                 else {
#                     j = cycles[i];
#                     swap = indices[i];
#                     indices[i] = indices[n-j];
#                     indices[n-j] = swap;
#                     return genResult();
#                 }
#             }
            
#             return undefined;
#         }, {$first:true,$index:0,$obj:this});
#     };

#     mod.permutations = new Sk.builtin.func(permutations_f);

#     return mod;
# };

def permutations(iterable, r=None):
    'permutations(range(3), 2) --> (0,1) (0,2) (1,0) (1,2) (2,0) (2,1)'
    pool = tuple(iterable)
    n = len(pool)
    r = n if r is None else r
    indices = range(n)
    cycles = range(n-r+1, n+1)[::-1]
    yield tuple(pool[i] for i in indices[:r])
    while n:
        for i in range(r)[::-1]:
            cycles[i] -= 1
            if cycles[i] == 0:
                indices[i:] = indices[i+1:] + indices[i:i+1]
                cycles[i] = n - i
            else:
                j = cycles[i]
                indices[i], indices[-j] = indices[-j], indices[i]
                yield tuple(pool[i] for i in indices[:r])
                break
        else:
            return

# print list(permutations(range(8)))