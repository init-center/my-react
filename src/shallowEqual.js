const hasOwn = Object.prototype.hasOwnProperty;

//Object.is 的 polyfill
function is(x, y) {
  if (x === y) {
    //处理+0和-0相等的情况
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    //处理NaN
    return x !== x && y !== y;
  }
}

export default function shallowEqual(objA, objB) {
  //基本数据类型比较
  if (is(objA, objB)) return true;
  // 由于Object.is()可以对基本数据类型做一个精确的比较， 所以如果不等
  // 只有一种情况是误判的，那就是object,所以在判断两个对象都不是object
  // 之后，就可以返回false了
  if (typeof objA !== 'object' || objA === null ||
    typeof objB !== 'object' || objB === null) {
    return false;
  }

  // 过滤掉基本数据类型之后，就是对对象的比较了
  // 首先拿出key值，对key的长度进行对比
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  // 长度不等直接返回false
  if (keysA.length !== keysB.length) return false;
  // key相等的情况下，再去循环比较
  for (let i = 0; i < keysA.length; i++) {
    // key值相等的时候
    // 借用原型链上真正的 hasOwnProperty 方法，判断ObjB里面是否有A的key的key值
    // 属性的顺序不影响结果也就是{name:'daisy', age:'24'} 跟{age:'24'，name:'daisy' }是一样的
    // 最后，对对象的value进行一个基本数据类型的比较，返回结果
    if (!hasOwn.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}