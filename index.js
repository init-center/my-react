import React from "./src/index";

import BrowserRouter, { BrowserRouterContext } from "./router/BrowserRouter";

import ReactDOM from "./src/react-dom";

class Element extends React.Component {
  render() {
    return <BrowserRouterContext.Consumer>
      {
        (value) => {
          return <div>{value}</div>
        }
      }
    </BrowserRouterContext.Consumer>
  }
}
class App extends React.Component {
  render() {
    return (<BrowserRouter>
        <Element></Element>
        <button onClick={() => {window.history.pushState({name: "history"}, "", "history")}}>pushState</button>
      </BrowserRouter>)
  }
}


ReactDOM.render(<App/>, document.getElementById("root"));