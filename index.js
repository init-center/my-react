import React from "./src/index";
import { useReducer, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "./src/hooks";
import ReactDOM from "./src/react-dom";



const Element = (
  <div class="wrapper">
    <h1 class="title" title="react-lite">React-lite</h1>
    <p class="intro" style={{color:"red", border: "1px solid red"}}>This is a simple implement of react!</p>
    by<span class="name" style="color: skyblue" onClick={() => {alert("SUPER_AI")}}> SUPER_AI</span>
  </div>
);


const Element2 = (
  <div class="wrapper-2">
    <h1 class="title-2">React-lite_2</h1>
    <p class="intro-2">This is a simple implement of react!!!</p>
    by<span class="name-2"> SUPER_AI_II</span>
  </div>
);

class Element3 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {...props};
  }

  render() {
    return (
      <div onclick={() =>this.clickHandle()}>{this.state.number}</div>
    )
  }

  clickHandle() {
    this.setState({
      number: this.state.number + 1
    });
  }
}

const Element4 = (props) => {

  function reducer(state, action) {
    switch (action.type) {
      case "ADD":
        return { count: state.count + 1 };
        break;
      default:
        return state;
        break;
    }  
  }
  const [countState, dispatch] = useReducer(reducer, {
    count: 0
  });
  const [count, setCount] = useState(100);
  const [count2, setCount2] = useState(200);
  // useLayoutEffect(() => {
  //   console.log("aaa");
  //   return () => {
  //     console.log("bbb")
  //   }
  // });

  // useEffect(() => {
  //   console.log("ccc");
  //   return () => {
  //     console.log("ddd");
  //   }
  // })

  const computeCount = useMemo(() => {
    return count * 2;
  },[count === 110]);

  const cacheCb = useCallback(() => {
    console.log(count);
  }, [count]);

  const ref1 = useRef();

  return (
    <div>
      <div onClick={() => dispatch({type: "ADD"})}>{countState.count}</div>
      <div onClick={() => setCount(count + 1)}>{count}</div>
      <div>computeCount:{computeCount}</div>
      <div onClick={() => setCount2(count2 + 2)}>{count2}</div>
      <button onClick={() => cacheCb()} ref={ref1}>cacheCb</button>
      <button onClick={() => ref1.current.style.color = "red"}>change Ref's color</button>
    </div>
  )
}



ReactDOM.render(<Element4 number={3}/>, document.getElementById("root"));

const render2Btn = document.getElementById("render2");
render2Btn.onclick = () => {
  ReactDOM.render(<Element4/>, document.getElementById("root"));
};

const render3Btn = document.getElementById("render3");
render3Btn.onclick = () => {
  ReactDOM.render(<Element3 number={3}/>, document.getElementById("root"));
};