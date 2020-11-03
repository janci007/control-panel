export function addTimestamp(fn){
  return function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    var datestr = "["+new Date().toISOString()+"] ";
    if((typeof first_parameter) === "string"){
      fn.apply(this, [datestr + first_parameter].concat(other_parameters));
    }else{
      fn.apply(this, [datestr, first_parameter].concat(other_parameters));
    }
  }
}