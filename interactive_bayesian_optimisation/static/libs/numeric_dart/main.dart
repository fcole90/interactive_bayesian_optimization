//import 'dart:js';
import 'dart:math';

void main() {
//  context['arange'] = arange;
//  context['np.linspace'] = linspace;
//  context['arangeJS'] = arangeJS;
//  context['jsify'] = (el) => JsObject.jsify(el);
  List myList = [[0, 1, 2], [3, 4, 5]];
  print(myList);
  print(5 is num);
  var x = NdArray(myList);
  print(x);

}

//JsObject arangeJS(num start, [num end, num step = 1]) {
//  return JsObject.jsify(arange(start, end, step));
//}


//---------------------------------------------------------------------


class NdArray {
  List innerList;

  NdArray(List initList) {
    this.fromInitList(initList);
  }

  NdArray fromInitList(List initList) {
    var innerList = [
      for (var el in initList) this._getListDeepClone(el)
    ];
    this.innerList = innerList;
  }

  dynamic _getListDeepClone(dynamic element) {
    if (element is List) {
      return [
        for (var subElement in element) this._getListDeepClone(subElement)
      ];
    }
    else if (element is num) {
      return element as num;
    }
    else {
      throw "Found bad type: ${element.runtimeType}";
    }
  }

  @override
  String toString() {
    return innerList.toString();
  }
}


NdArray linspace(num start, num end, int n) {
  num step = (end - start) / (n - 1);
  return NdArray(List<num>.generate(n, (i) => start + i * step));
}


NdArray arange(num start, [num end, num step = 1]) {
  if (end == null) {
    end = start;
    start = 0;
  }
  int length = (end - start) ~/ step;
  return NdArray(List<num>.generate(length, (i) => start + i * step));
}

num argmax(List<num> a) {
  int argmaxIndex = 0;
  num maxEl = a[0];
  for (int i = 1; i < a.length; i++) {
    if  (a[i] > maxEl) {
      maxEl = a[i];
      argmaxIndex = i;
    }
  }
  return argmaxIndex;
}
