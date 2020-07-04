import React from "./src/index";

import BrowserRouter, { BrowserRouterContext } from "./router/BrowserRouter";
import { Switch } from "./router/Switch";
import { Route } from "./router/route";

import ReactDOM from "./src/react-dom";
class Element extends React.Component {
  render() {
    return <div>Element</div>
  }
}

class Element2 extends React.Component {
  render() {
    return <div>Element2</div>
  }
}

const HistoryEle = (props) => {
  return <div>historyEle</div>
}
class App extends React.Component {
  render() {
    return (<BrowserRouter>
        <Route path="/" component={Element}></Route>
        <Route path="/history" render={()=> {
          return <div>render history</div>
        }}>
          <div>a history children</div>
        </Route>
        <Route path="/history/:id" component={HistoryEle}></Route>
        <button onClick={() => {window.history.pushState({name: "history"}, "", "/history/abc")}}>pushState</button>
      </BrowserRouter>)
  }
}


ReactDOM.render(<App/>, document.getElementById("root"));