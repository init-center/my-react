import React, { createContext, createRef } from "./src/index";
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

  componentDidUpdate() {
    console.log("componentDidUpdate Element")
  }

  render() {
    console.log("render Element");
    const {a, b} = this.state;
    return (
      <div>
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

  static getDerivedStateFromProps() {
    console.log('getDerivedStateFromProps Element2')
  }

  componentDidUpdate() {
    console.log("componentDidUpdate Element2")
  }

  render() {
    console.log("render Element2")
    return (
      <div div onClick = {
        () => {
          this.setState({
            a: this.state.a + 1,
            b: this.state.b + 1
          })
        }
      } >
        <div>{this.state.a}</div>
        <div>{this.state.b}</div>
      </div>
      );
  }
}


ReactDOM.render(<Element/>, document.getElementById("root"));