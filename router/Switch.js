import React, { Component } from "../src/index";
import { BrowserRouterContext } from "./BrowserRouter";
import { matchPath } from "./matchpath";

export default class Switch extends Component {
  static contextType = BrowserRouterContext;
  constructor(props) {
    super(props);
  }

  render() {
    const history = this.context;
    const pathname = history.pathname;
    const children = this.props.children
      .flat()
      .filter((child) => child.type.isRouteComponent);
    if (children.length === 0) {
      return null;
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const { exact, strict, sensitive } = child.props;
      const path = child.props.path ? child.props.path : "/";
      const matchResult = matchPath(pathname, {
        sensitive,
        exact,
        strict,
        path,
      });
      if (matchResult) {
        return child;
      }
    }

    return null;
  }
}
