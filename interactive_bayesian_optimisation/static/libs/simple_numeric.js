// Numpy-like functions
"use strict";
import * as bs from "./basic_utils.js";


let np = function () {
    function linspace(start, end, n) {
        let lin_list = [];
        let interval = end - start;
        let step = interval / (n - 1);
        for (let i = 0; i < n; i++) {
            lin_list.push(start + (i * step));
        }
        return lin_list;
    }


    function list_max(a_list) {
        return Math.max.apply(null, a_list);
    }

    function list_argmax(a_list) {
        let list_len = bs.len(a_list);
        bs.assert(
            list_len > 0,
            `The given list have length > 0. Found length=${bs.len(a_list)} instead.`);
        if (list_len === 1) { return 0; }
        let argmax_index = 0;
        let max_value = a_list[0];
        for (let i = 1; i < list_len; i++) {
            if (a_list[i] > max_value) {
                argmax_index = i;
                max_value = a_list[i];
            }
        }
        return argmax_index;
    }

    function list_argmin(a_list) {
        let argmin_index = 0;
        let min_value = a_list[0];
        for (let i = 1; i < a_list.length; i++) {
            if (a_list[i] < min_value) {
                argmax_index = i;
                min_value = a_list[i];
            }
        }
        return argmin_index;
    }

    function list_argequal(a_list, a_val) {
        let argeq_index = 0;
        for (let i = 1; i < a_list.length; i++) {
            if (a_list[i] === a_val) {
                return i;
            }
        }
        logging.debug("Argument not found");
        return null;
    }


    function list_min(a_list) {
        return Math.min.apply(null, a_list);
    }


    function list_list_max(a_list_list) {
        let max_list = [];
        for (let i = 0; i < a_list_list.length; i++) {
            max_list.push(list_max(a_list_list[i]));
        }
        return list_max(max_list);
    }


    function list_list_min(a_list_list) {
        let min_list = [];
        for (let i = 0; i < a_list_list.length; i++) {
            min_list.push(list_min(a_list_list[i]));
        }
        return list_min(min_list);
    }

    // Expose functions
    return {
        linspace: linspace,
        list_argmax: list_argmax,
        list_max: list_max,
        list_min: list_min,
        list_list_max: list_list_max,
        list_list_min: list_list_min,
        list_argmin: list_argmin,
        list_argequal: list_argequal
    }
}();

export default np;
export { np };