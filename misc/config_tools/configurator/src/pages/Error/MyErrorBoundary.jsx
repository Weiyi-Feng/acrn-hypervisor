import {Component} from "react";

export default class MyErrorBoundary extends Component {
    state = {
        hasError: false,
    };

    static getDerivedStateFromError(error) {
        return {hasError: true};
    };

    componentDidCatch(error, errorInfo) {
        // A custom error logging function
        console.log(error, errorInfo);
    };

    render() {
        return this.state.hasError ? <a href="#" onClick={() => {
            location.search = "#"
        }}>Refresh</a> : this.props.children;
    }
}