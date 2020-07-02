import React, { Component, createContext } from "../src/index";


export const BrowserRouterContext = createContext(window.location.pathname);

export default class BrowserRouter extends Component {
  constructor(props) {
    super(props);
    this.listenHistory();
  }

  listenHistory() {
    window.addEventListener("popstate", this.listenFunction, false);
  }

  listenFunction(e) {
    console.log(e)
  }

  render() {
    return (<BrowserRouterContext.Provider value={window.location.pathname}>
      { this.props.children }
    </BrowserRouterContext.Provider>);
  }
}