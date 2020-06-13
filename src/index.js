import { createElement } from "./createElement";
import { Update } from "./updateQueue";
import { reconcileRoot } from "./reconciler";

//实现类组件
class Component {
  //这个静态属性用来标志这是个类组件
  static _isClassComponent = true;
  props = {};
  state = {};
  constructor(props) {
    this.props = props;

  }

  setState(payload) {
    const update = new Update(payload);
    //实例上会挂载internalFiber属性，这个属性是这个实例对应的fiber
    //fiber上会挂载一个updateQueue实例
    this.internalFiber.updateQueue.enqueue(update);
    reconcileRoot();
  }
}


function createRef() {
  const refObject = {
    current: null
  };

  return refObject;
}

const React = {
  createElement,
  Component,
  createRef
};

export default React;