import { Component } from "./index";

export default class Suspense extends Component {
  _isSuspenseComponent = true;
  _status = -1;
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }

  componentDidCatch(error) {
    if (
      error &&
      typeof error === "object" &&
      typeof error.then === "function"
    ) {
      this._status = 0;
      this.setState(
        {
          isLoading: true,
        },
        () => {
          error.then(() => {
            this._status = 1;
            this.thenable = null;
            this.setState({
              isLoading: false,
            });
          });
          error.catch(() => {
            this._status = 2;
            this.thenable = null;
            throw error;
          });
        }
      );
    }
  }

  render() {
    const { children, fallback } = this.props;
    if (this.state.isLoading) {
      return fallback;
    } else {
      return children;
    }
  }
}
