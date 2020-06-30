import React from "./index";

export default class Suspense extends React.Component {
  _isSuspenseComponent = true;
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };
  }

  componentDidCatch(error) {
    if (error && typeof error === "object" && typeof error.then === "function") {
      this.setState({
        isLoading: true
      }, () => {
        error.then(() => {
          this.setState({
            isLoading: false
          })
        })
      })
    }
  }

  render() {
    const { children, fallback } = this.props;
    if(this.state.isLoading) {
      return fallback;
    } else {
      return children;
    }
  }
}