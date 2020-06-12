export function getNearestParentDOMFiber(parentFiber) {
  while(parentFiber && typeof parentFiber.type === "function") {
    parentFiber = parentFiber.parentFiber;
  }
  return parentFiber;
}

export function getNearestChildDOMFiber(childFiber) {
  while (childFiber && typeof childFiber.type === "function") {
    childFiber = childFiber.childFiber;
  }
  return childFiber;
}