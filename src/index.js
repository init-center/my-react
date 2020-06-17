import { createElement } from "./createElement";
import { Update } from "./updateQueue";
import { reconcileRoot } from "./reconciler";

//实现类组件
class Component {
  //这个静态属性用来标志这是个类组件
  static _isClassComponent = true;
  props = {};
  state = {};
  context = null;
  constructor(props) {
    this.props = props;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    //返回null或者一个对象，和本来的state合并（放入到updateQueue中还是直接改变再研究看看）
    //在 shouldComponentUpdate和render（组件自己的render，不是react-dom的render）之前调用

  }

  componentDidMount() {
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  getSnapshotBeforeUpdate() {
    //render以后会触发
    //如果jsx产生了Dom改变，就会触发这个方法，这个方法的返回会传递给
    //componentDidUpdate
    //传给它作为第三个参数（info），info是可选的，有就传没有就不传

  }

  componentDidUpdate(prevProps, prevState, info) {
  }

  componentWillUnmount() {
  }

  setState(payload) {
    const update = new Update(payload);
    //实例上会挂载internalFiber属性，这个属性是这个实例对应的fiber
    //fiber上会挂载一个updateQueue实例
    this.internalFiber.updateQueue.enqueue(update);
    reconcileRoot();
  }
}


export function createRef() {
  const refObject = {
    current: null
  };
  return refObject;
}

export function createContext(defaultValue) {
  class Provider extends Component {
    static _isContextProvider = true;
    constructor(props) {
      super(props);
    }

    render() {
      Provider.currentValue = (this.props && this.props.value) ? this.props.value : defaultValue;
      return this.props.children;
    }
  }

  class Consumer extends Component {
    static _isContextConsumer = true;
    constructor(props) {
      super(props);
    }

    render() {
      return this.props.children;
    }
  }

  return {
    Provider,
    Consumer
  };
}

const React = {
  createElement,
  Component,
  createRef,
  createContext
};

export default React;