'use strict';

const assert = require('assert');

const Matrix = module.exports = function(src, empty) {
    this.unit = Matrix.vailder(src);
    this.source = src;
    this.empty = empty;
    this.values = this.getValues();
    this.status = {};
};

Matrix.prototype = {
    constructor: Matrix,
    getValues: function() {
        return Array(this.source.length)
            .fill(0)
            .map((cur, i) => i + 1);
    },
    getEmpties: function() {
        return [
            [], ...this.source
        ].reduce((res, row, i) => {
            row.forEach((val, j) =>
                val === this.empty && (res.push([i - 1, j]))
            );
            return res;
        });
    },
    getCoors: function(coor, has) {
        const rows = this.source[coor[0]].map((cur, i) => [coor[0], i]),
            cols = this.source.map((cur, i) => [i, coor[1]]),
            cells = [],
            start = [
                Math.floor(coor[0] / this.unit) * this.unit,
                Math.floor(coor[1] / this.unit) * this.unit
            ];
        for (let i = start[0]; i < start[0] + this.unit; i++) {
            for (let j = start[1]; j < start[1] + this.unit; j++) {
                if (coor[0] === i && coor[1] === j) continue;
                cells.push([i, j]);
            }
        }
        const coors = [...rows, ...cols].filter(cur =>
            cells.every(me =>
                !(me[0] === cur[0] && me[1] === cur[1])
            ) && (cur[0] !== coor[0] || cur[1] !== coor[1])
        ).concat(cells);
        if (typeof has !== 'boolean') return coors;
        return coors.filter(cur => has ?
            this.source[cur[0]][cur[1]] !== this.empty :
            this.source[cur[0]][cur[1]] === this.empty
        );
    }
};

Matrix.preset = { maximum: 10 };

Matrix.vailder = function(matrix) {
    const unit = Math.sqrt(matrix.length);
    assert(Math.floor(unit) === unit && unit <= Matrix.preset.maximum,
        'matrix is invaild.'
    );
    return unit;
};

Matrix.merge = function(ar) {
    const excludes = [
        [],
        ...[].slice.call(arguments, 1)
    ].reduce((res, cur) => res.concat(cur));
    if (!excludes.length) return ar;
    return ar.filter(cur =>
        excludes.indexOf(cur) === -1
    );
};

Matrix.go = function(callback) {
    const empties = this.getEmpties();
    [this.status, ...empties].reduce((ctx, cur) => {
        const others = this.getCoors(cur, true)
            .map(me => this.source[me[0]][me[1]]);
        ctx[cur] = Matrix.merge(this.values, others);
        return ctx;
    });
    let cont = true;
    while (cont) {
        cont = !cont;
        [this.status, ...empties].reduce((ctx, cur) => {
            if (ctx[cur].length > 1 || ctx[cur].completed) return ctx;
            this.getCoors(cur, false).forEach(coor => {
                const len = ctx[coor].length;
                ctx[coor] = Matrix.merge(ctx[coor], ctx[cur]);
                cont = cont || ctx[coor].length === 1 && len !== 1;
            });
            ctx[cur].completed = true;
            return ctx;
        });
    }
    return [this, ...empties].reduce((ctx, cur) => {
        const val = ctx.status[cur];
        if (val.length > 1) return callback(ctx, cur);
        ctx.source[cur[0]][cur[1]] = val[0];
        return ctx;
    });
};