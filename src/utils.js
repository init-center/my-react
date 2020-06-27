export function getNearestParentDOMFiber(parentFiber) {
  while(parentFiber && (typeof parentFiber.type === "function" || typeof parentFiber.type === "object")) {
    parentFiber = parentFiber.parentFiber;
  }
  return parentFiber;
}

export function getNearestChildDOMFiber(childFiber) {
  while (childFiber && (typeof childFiber.type === "function" || typeof childFiber.type === "object")) {
    childFiber = childFiber.childFiber;
  }
  //lazyComp这个没有childFiber
  return childFiber;
}