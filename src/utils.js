export function getNearestParentDOMFiber(parentFiber) {
  while (parentFiber && (typeof parentFiber.type === "function" || typeof parentFiber.type === "object")) {
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



function isHostComponent(fiber) {
  //原生节点type是string并且它不是portal节点
  //因为原生节点也有可能成为portal节点
  //所以要进一步判断
  if(typeof fiber.type === "string" && !fiber.isPortalComponent) {
    return true;
  }
  return false;
}


export function getHostSibling(fiber) {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node = fiber;
  // 外层while循环
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    // 如果没有兄弟节点，向上查找父节点，但是这个父节点不能是原生dom节点
    while (!node.siblingFiber) {
      if (!node.parentFiber || isHostComponent(node.parentFiber)) {
        // 如果到了根节点root了 或者 是原生dom节点  返回 null 说明在真实的dom中 插入的这个节点没有兄弟节点
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      node = node.parentFiber;
    }
    // 下面是有兄弟节点的情况
    node = node.siblingFiber;
    // 兄弟节点不是HostComponent也不是HostText
    while (!(isHostComponent(node))) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      // 兄弟节点也是将要插入的节点，跳过这个节点查找下一个兄弟节点
      if (node.effectTag === "PLACEMENT") {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      // 如果没有子节点或者是HostPortal也跳过这个节点查找下一个兄弟节点
      if ((!node.childFiber) || node.isPortalComponent) {
        continue siblings;
      } else {
        // 否则返回兄弟节点的子节点
        node = node.childFiber;
      }
    }
    // Check if this host node is stable or about to be placed.
    // 如果兄弟节点也是新增节点，寻找下一个兄弟节点
    // 否则，就找到了！
    if (!(node.effectTag === "PLACEMENT")) {
      // Found it!
      return node.stateNode;
    }
  }
}