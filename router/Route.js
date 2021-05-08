import React, { Component } from "../src/index";
import { BrowserRouterContext }  from "./BrowserRouter";
import { matchPath } from "./matchpath";

export default class Route extends Component {
  static contextType = BrowserRouterContext;
  static isRouteComponent = true;
  constructor(props) {
    super(props);

  }

  render() {
    const history = this.context;
    const pathname = history.pathname;
    const Component = this.props.component;
    const path = this.props.path || "/";
    const match = matchPath(pathname, {
      sensitive: false,
      exact: false,
      strict: false,
      path
    });

    if(!match) {
      return null;
    }

    if(Component) {
      return <Component match={match} history={history}/>;
    } else if(this.props.render) {
      if(typeof this.props.render !== "function") {
        console.error("TypeError: render expects to receive a function, not " + typeof this.props.render);
        return null;
      } else {
        return this.props.render({match, history});
      }
    }else if(this.props.children) {
      if(typeof this.props.children === "function") {
        return this.props.children({match, history});
      }
      return this.props.children;
    } else {
      return null;
    }
  }
}