import React from "react";
import {useNavigate} from "react-router";
import {Button, Form} from "react-bootstrap";

import {buildPageParams, unique} from "../../../lib/common";

import {resolveHome} from "../../../lib/common";

import Confirm from "../../../components/Confirm/Confirm";
import {dialog, fs} from "@tauri-apps/api";


class StartNewConfigurationPanel extends React.Component {
    constructor(props) {
        super(props);
        const {navigate} = this.props;
        this.navigate = navigate
        this.pathInput = React.createRef()
        this.defaultPath = "~/acrn-work/MyConfiguration/"
    }

    addRecentDir = (dirPath) => {
        let recent = localStorage.getItem('ACRN_v1_recentDir');
        recent = recent ? JSON.parse(recent) : []
        recent.push(dirPath)
        recent = unique(recent)
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
            title: "Start new configurator",
            directory: true,
            multiple: false
        }).then((filePath) => {
            this.pathInput.current.value = filePath
        })
    }

    useFolder = async () => {
        let folderPath = this.pathInput.current.value ? this.pathInput.current.value : this.pathInput.current.placeholder;
        let homeResolvePath = await resolveHome(folderPath)

        fs.readDir(homeResolvePath)
            .then((files) => {
                console.log("Directory exists.", files)
                if (files.length > 0) {
                    confirm("Directory exists, overwrite it?").then((r) => {
                        if (r) this.nextPage(folderPath)
                    })
                } else {
                    this.nextPage(folderPath)
                }
            })
            .catch(() => {
                fs.createDir(homeResolvePath, {recursive: true})
                    .then(() => {
                        console.log('Directory created successfully!');
                        this.nextPage(folderPath)
                    }).catch((err) => {
                    return console.error(err);
                })
            })
    }
    handleConfirm = (params) => {
        console.log(params)
    }


    render = () => {
        return (
            <Form>
                <b className="py-2" style={{"letterSpacing": "0.49px"}}>Start a new
                    configuration</b>
                <p className="py-3 mb-2" style={{maxWidth: "465px", letterSpacing: "-0.143px"}}>
                    ACRN Configurator saves your scenario and configuration files into a working
                    folder.
                </p>
                <label className="d-block pb-2" style={{"letterSpacing": "-0.29px"}}>
                    Select the working folder
                </label>
                <table>
                    <tbody>
                    <tr>
                        <td style={{width: "100%"}}>
                            <Form.Control
                                type="text" ref={this.pathInput} className="d-inline"

                                defaultValue={this.defaultPath} placeholder={this.defaultPath}
                            />
                        </td>
                        <td>
                            <a className="ps-3 text-nowrap" href="#" onClick={this.openDir}>Browse for folder…</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div className="py-4 text-right">
                                <Confirm callback={this.handleConfirm}/>
                                <Button className="wel-btn" size="lg" onClick={this.useFolder}> Use this
                                    Folder </Button>
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

    return <StartNewConfigurationPanel {...props} navigate={navigate}/>;
}