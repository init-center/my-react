import React, { createContext, createRef, Fragment, PureComponent, memo } from "./src/index";
import { 
  useReducer, 
  useState, 
  useEffect, 
  useLayoutEffect, 
  useMemo, 
  useCallback,
  useContext, 
  useRef } from "./src/hooks";
import { lazy } from "./src/lazy";
import ReactDOM from "./src/react-dom";
import Suspense from "./src/suspense";

const LazyComp = lazy(() => import("./lazy-comp"));

const Element4 = memo((props) => {
  return props.children;
})

class Element extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      a: 100,
      b: 200,
      c: 300,
      hasError: false
    };
  }

  shouldComponentUpdate() {
    console.log("shouldComponentUpdate Element")
    return true;
  }

  static getDerivedStateFromProps() {
    console.log('getDerivedStateFromProps Element')
  }

  componentDidMount() {
    console.log("componentDidMount Element");
  }

  componentDidUpdate(a, b) {
    console.log("componentDidUpdate Element")
  }

  static getDerivedStateFromError(e) {
    console.log(e)
    return {
      hasError: true
    }
  }

  componentDidCatch(e, stack) {
    console.log(e)
    console.log(stack)
  }

  render() {
    console.log("render Element");
    const {a, b} = this.state;
    if(this.state.hasError) {
      return <div>出现了一些错误</div>
    } else {
      return (
      <div onClick={() => {this.setState({
        a: this.state.a + 1,
        b: this.state.b + 1
      })}}>
        <Element2 a={a} b={b}/>
        <Element3 number={this.state.c}></Element3>
      </div>
    );
    }
  }
}

class Element2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      a: this.props.a,
      b: this.props.b
    };
  }

  shouldComponentUpdate() {
    console.log("shouldComponentUpdate Element2")
    return true;
  }

  componentDidMount() {
    console.log("componentDidMount Element2");
  }

  static getDerivedStateFromProps() {
    console.log('getDerivedStateFromProps Element2')
  }

  getSnapshotBeforeUpdate() {
    console.log("getSnapshotBeforeUpdate Element2")
    return "Element Snapshot"
  }



  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log("componentDidUpdate Element2")
  }

  render() {
    console.log("render Element2");
    return (
      <div>
        <div>{this.props.a}</div>
        <div>{this.props.b}</div>
        <Suspense fallback={<div>this is a fallback</div>}>
          <LazyComp></LazyComp>
        </Suspense>
        {
          ReactDOM.createPortal(<div>this is a createPortal</div>, document.getElementById("portal-container"))
        }
        <Element4>
          <div id="123">123</div>
          <div id="456">456</div>
          <div id="789">789</div>
          <div id="101112">101112</div>
        </Element4>
      </div>
      );
  }
}

class Element3 extends PureComponent {
  render() {
    console.log("render Element3")
    return <p>{this.props.number}</p>
  }
}


ReactDOM.render(<Element/>, document.getElementById("root"));