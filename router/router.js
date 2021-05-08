import BrowserRouter from "./BrowserRouter";
import Route from "./Route";
import Switch from "./Switch";
import withRouter from "./withRouter";

const router = {
  BrowserRouter,
  Route,
  Switch,
  withRouter,
  createBrowserHistory: () => window.history,
};

export default router;
