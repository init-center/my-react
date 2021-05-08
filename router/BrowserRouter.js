import React, { Component, createContext } from "../src/index";

export const BrowserRouterContext = createContext(window.location.pathname);

export default class BrowserRouter extends Component {
  constructor(props) {
    super(props);
    this.runHistoryStateHook();
    this.listenHistory();
    this.state = {
      history: {
        pathname: window.location.pathname,
      },
    };
  }

  listenFunction = (e) => {
    const currentPathname = window.location.pathname;
    if (this.state.history.pathname !== currentPathname) {
      this.setState({
        ...this.state,
        history: {
          pathname: currentPathname,
        },
      });
    }
  };

  listenHistory() {
    window.addEventListener("popstate", this.listenFunction, false);
    window.addEventListener("pushState", this.listenFunction, false);
    window.addEventListener("replaceState", this.listenFunction, false);
  }

  runHistoryStateHook() {
    function historyStateHook(eventType) {
      const origin = window.history[eventType];
      return function (state, title, url) {
        //需要用call，因为直接调用会失去上下文环境, 非法调用
        origin.call(this, state, title, url);
        const stateEvent = new Event(eventType);
        window.dispatchEvent(stateEvent);
      };
    }
    window.history.pushState = historyStateHook("pushState");
    window.history.replaceState = historyStateHook("replaceState");
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.listenFunction, false);
  }

  render() {
    return (
      <BrowserRouterContext.Provider value={this.state.history}>
        {this.props.children}
      </BrowserRouterContext.Provider>
    );
  }
}
