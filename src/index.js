import { createElement } from "./createElement";
import { Update } from "./updateQueue";
import { reconcileRoot } from "./reconciler";
import shallowEqual from "./shallowEqual";
import compareChildren from "./compareChildren";
import Suspense from "./suspense";
import lazy from "./lazy";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from "./hooks";

//实现类组件
export class Component {
  //这个静态属性用来标志这是个类组件
  static _isClassComponent = true;
  props = {};
  state = {};
  context = null;
  callbacks = [];
  constructor(props) {
    this.props = props;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    //返回null或者一个对象，和本来的state合并（放入到updateQueue中还是直接改变再研究看看）
    //在 shouldComponentUpdate和render（组件自己的render，不是react-dom的render）之前调用
    //console.log("getDerivedState")
  }

  componentDidMount() {}

  shouldComponentUpdate(nextProps, nextState) {
    //console.log("shouldComponentUpdate")
    return true;
  }

  getSnapshotBeforeUpdate() {
    //render以后会触发，但是render之后还没有更新DOM，所以可以获取老DOM的状态
    //比如获取DOM的滚动位置，获取之后
    //这个方法的返回会传递给
    //componentDidUpdate
    //传给它作为第三个参数（info），info是可选的，有就传没有就不传
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //prevProps和prevState都是更新之前的没错
    //第三个参数是getSnapshotBeforeUpdate的返回值
    //因为DidUpdate是在更新完DOM之后才会触发，这时可以通过snapshot来改变DOM的状态之类的
    //console.log("componentDidUpdate")
  }

  componentWillUnmount() {}

  setState(payload, callback) {
    const update = new Update(payload);
    //实例上会挂载internalFiber属性，这个属性是这个实例对应的fiber
    //fiber上会挂载一个updateQueue实例
    this.internalFiber.updateQueue.enqueue(update);
    this.callbacks.push(callback);
    reconcileRoot();
  }
}

export class PureComponent extends Component {
  static _isPureClassComponent = true;
  shouldComponentUpdate(nextProps, nextState) {
    //因为children都是数组，所以可能会一直是false
    //需要特殊处理一下
    const oldProps = { ...this.props, children: null };
    const newProps = { ...nextProps, children: null };
    const oldChildren = this.props.children;
    const newChildren = nextProps.children;
    if (
      shallowEqual(oldProps, newProps) &&
      compareChildren(oldChildren, newChildren) &&
      shallowEqual(this.state, nextState)
    ) {
      return false;
    }
    return true;
  }
}

export function memo(component, compare) {
  return {
    isMemoComponent: true,
    component: component,
    compare: compare,
  };
}

export function createRef() {
  const refObject = {
    current: null,
  };
  return refObject;
}

export function Fragment(props) {
  return props.children;
}

export function createContext(defaultValue) {
  class Provider extends Component {
    static _isContextProvider = true;
    constructor(props) {
      super(props);
    }

    render() {
      Provider.currentValue =
        this.props && this.props.value ? this.props.value : defaultValue;
      return this.props.children;
    }
  }

  class Consumer extends Component {
    static _isContextConsumer = true;
    static provider = Provider;
    constructor(props) {
      super(props);
    }

    render() {
      return this.props.children;
    }
  }

  return {
    Provider,
    Consumer,
  };
}

const React = {
  createElement,
  Component,
  PureComponent,
  createRef,
  createContext,
  Suspense,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  lazy,
};

export default React;
