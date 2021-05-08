import React from "../src/index";
import { BrowserRouterContext } from "./BrowserRouter";
export default function withRouter(Component) {
  return (
    <BrowserRouterContext.Consumer>
      {(context) => {
        return <Component {...context} />;
      }}
    </BrowserRouterContext.Consumer>
  );
}
