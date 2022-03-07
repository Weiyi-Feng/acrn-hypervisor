import {Component} from "react";
import {getVersion} from "@tauri-apps/api/app";


export default class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            version: "0.1.0"
        }
    }

    componentDidMount = () => {
        getVersion().then((version) => {
            this.setState({version: version})
        })
    }

    render = () => {
        return <p className="text-center">© 2022 Intel, Inc. ACRN Configurator - Version {this.state.version}</p>
    }
}