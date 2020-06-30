import { Component, createContext } from "../src/index";


const BrowserRouterContext = createContext(window.location.pathname);

class BrowserRouter extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    <BrowserRouterContext.Provider value={window.location.pathname}>
      { this.props.children }
    </BrowserRouterContext.Provider>
  }
}