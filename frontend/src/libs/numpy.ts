// Numpy-like functions
const linspace = (start: number, end: number, n: number) => {
  const interval = end - start
  const step = interval / (n - 1)
  return new Array(n).map((_, i) => start + (i * step))
}


const list_max = (a_list: number[]) => Math.max(...a_list)
const list_min = (a_list: number[]) => Math.min(...a_list)

const list_argequal = (a_list: number[], a_val: number) => a_list.findIndex(val => val === a_val)

const list_argmax = (a_list: number[]) => list_argequal(a_list, list_max(a_list))
const list_argmin = (a_list: number[]) => list_argequal(a_list, list_min(a_list))


const list_list_max = (a_list_list: number[][]) => list_max(a_list_list.flat())
const list_list_min = (a_list_list: number[][]) => list_min(a_list_list.flat())
 

export const numpy = {
  linspace,
  list_argmax,
  list_max,
  list_min,
  list_list_max,
  list_list_min,
  list_argmin,
  list_argequal,
}
