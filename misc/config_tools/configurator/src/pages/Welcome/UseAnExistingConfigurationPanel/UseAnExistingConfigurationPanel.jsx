import {useNavigate} from "react-router";
import React from "react";
import {Button, Form} from "react-bootstrap";
import {buildPageParams,  unique} from "../../../lib/common";
import {dialog} from "@tauri-apps/api";


class UseAnExistingConfigurationPanel extends React.Component {
    constructor(props) {
        super(props);
        const {navigate} = this.props;
        this.navigate = navigate
        this.pathSelect = React.createRef()
        this.state = {
            recentDirs: []
        }
    }

    recentDir = () => {
        let recent
        if (this.state.recentDirs.length) {
            recent = this.state.recentDirs
        } else {
            recent = localStorage.getItem('ACRN_v1_recentDir')
            recent = recent ? JSON.parse(recent) : []
        }

        return recent.map(function (boardName, index) {
            return (<option key={index} value={boardName}>
                {boardName}
            </option>)
        })
    }

    addRecentDir = (dirPath) => {
        let recent = localStorage.getItem('ACRN_v1_recentDir');
        recent = recent ? JSON.parse(recent) : []
        recent.push(dirPath)
        recent = unique(recent)
        this.setState({recentDirs: recent})
        recent = JSON.stringify(recent)
        localStorage.setItem('ACRN_v1_recentDir', recent)
    }

    nextPage = (WorkingFolder) => {
        this.addRecentDir(WorkingFolder)
        let pageParams = {WorkingFolder};
        pageParams = buildPageParams('./config', pageParams)
        this.navigate(pageParams);
    }

    openDir = () => {
        dialog.open({
            title: 'Open Working Folder',
            directory: true,
            multiple: false
        }).then((filePath) => {
                let existDir = filePath
                this.addRecentDir(existDir)
                this.pathSelect.current.value = existDir
            }
        )
    }

    useFolder = () => {
        let folderPath = this.pathSelect.current.value;
        if (!folderPath) {
            alert("Please select existing configuration folder!")
            return
        }


        this.nextPage(folderPath, true)
    }

    render() {
        return (
            <Form>
                <b className="py-2">Use an existing configuration</b>
                <p className="py-3 mb-0 mb-sm-4" style={{"maxWidth": "462px", "letterSpacing": "-0.3px"}}>
                    Open a working folder to retrieve an existing configuration.
                </p>
                <label className="d-block py-2" style={{"letterSpacing": "-0.29px"}}>
                    Select the working folder
                </label>
                <table>
                    <tbody>
                    <tr>
                        <td>
                            <Form.Select ref={this.pathSelect} className="d-inline">
                                {this.recentDir()}
                            </Form.Select>
                        </td>
                        <td>
                            <a className="ps-3 text-nowrap" href="#" onClick={this.openDir}>Browse for folder…</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div className="py-4 text-right">
                                <Button className="wel-btn" size="lg" onClick={this.useFolder}>Open Folder</Button>
                            </div>
                        </td>
                        <td/>
                    </tr>
                    </tbody>
                </table>

            </Form>
        )
    }
}

export default function (props) {
    const navigate = useNavigate();

    return <UseAnExistingConfigurationPanel {...props} navigate={navigate}/>;
}