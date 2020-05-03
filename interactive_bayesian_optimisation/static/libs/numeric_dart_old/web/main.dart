//@JS()
//library lib;

//import 'package:js/js.dart';
import 'dart:js';

//@JS()
//external void invokeCallback(void Function() callback);

void main() {
  String foo() {
    return "bar!";
  }

  context['foo'] = foo;
  //context['document'];
  
  //allowInterop(() => print('Called!')
  
  //void call_() {
  //  print('Called!');
  //}
  //invokeCallback(allowInterop(() => print('Called!')));
}
