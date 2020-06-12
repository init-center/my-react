import {
  reconcileRoot
} from "./reconciler";
import {
  createTextElement
} from "./createElement";

function render(element, container) {
  if(typeof element === "function") {
    console.error(`Warning: Functions are not valid as a React child. 
    This may happen if you return a Component instead of <Component /> from render. 
    Or maybe you meant to call this function rather than return it.`);
    return;
  }
  // 创建rootFiber
  // 需要注意的是rootFiber 对应的是container
  //而不是element
  const rootFiber = {
    stateNode: container,
    props: {
      children: [typeof element === "string" || typeof element === "number" ? createTextElement(element) : element]
    }
  };

  //调度rootFiber
  reconcileRoot(rootFiber);
}

const ReactDOM = {
  render
}

export default ReactDOM;