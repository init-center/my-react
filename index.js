import React, { createContext, createRef, Fragment } from "./src/index";
import { 
  useReducer, 
  useState, 
  useEffect, 
  useLayoutEffect, 
  useMemo, 
  useCallback,
  useContext, 
  useRef } from "./src/hooks";
import ReactDOM from "./src/react-dom";

class Element extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      a: 100,
      b: 200
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

  render() {
    console.log("render Element");
    const {a, b} = this.state;
    return (
      <div onClick={() => {this.setState({
        a: this.state.a + 1,
        b: this.state.b + 1
      })}}>
        <Element2 a={a} b={b}/>
      </div>
    );
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
    console.log(prevProps, prevState, snapshot)
  }

  render() {
    console.log("render Element2")
    throw new Error("a Error in Element2")
    return (
      <div /*onClick = {
        () => {
          this.setState({
            a: this.state.a + 1,
            b: this.state.b + 1
          })
        }
      }*/ >
        <div>{this.props.a}</div>
        <div>{this.props.b}</div>
      </div>
      );
  }
}


ReactDOM.render(<Element/>, document.getElementById("root"));