export default function compareChildren(oldChildren, newChildren) {
  //如果两个长度都为0，相等
  if (oldChildren.length === 0 && newChildren.length === 0) {
    return true;
  }
  //如果两个长度不相等，不相等
  if(oldChildren.length !== newChildren.length) {
    return false;
  }

  //如果长度一致，对里面的每个对象进行shallowEqual
  
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];
    const isTextElement = oldChild.type === "TEXT_ELEMENT" && newChild.type === "TEXT_ELEMENT";
    //不是文本节点就返回false
    //为什么非文本节点就返回false呢
    //因为children里还有children，不可能一直循环判断下去
    //而如果浅层比较，那么两个对象肯定是不相等的
    if(!isTextElement) {
      return false;
    }

    //两个都是文本节点，判断他们的value是否相同
    if(oldChild.props.value === newChild.props.value) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}