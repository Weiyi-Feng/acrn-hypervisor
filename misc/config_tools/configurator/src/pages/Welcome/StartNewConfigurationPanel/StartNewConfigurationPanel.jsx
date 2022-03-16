import React from "react";
import {useNavigate} from "react-router";
import {Button, Form} from "react-bootstrap";

import {buildPageParams} from "../../../lib/common";

import Confirm from "../../../components/Confirm/Confirm";
import {dialog, fs} from "@tauri-apps/api";
import {ACRNContext} from "../../../ACRNContext";


class StartNewConfigurationPanel extends React.Component {
    constructor(props, context) {
        super(props);
        const {navigate} = this.props;
        this.navigate = navigate
        this.pathInput = React.createRef()
        let {config} = context
        this.defaultPath = config.defaultWorkingFolder
    }

    addRecentDir = async (dirPath) => {
        let {config, configurator} = this.context;
        await configurator.addHistory(config.configKey.recentlyWorkingFolders, dirPath);
    }

    nextPage = (WorkingFolder) => {
        this.addRecentDir(WorkingFolder)
            .then(() => {
                let {configurator} = this.context;
                configurator.settingWorkingFolder(WorkingFolder)
                this.navigate({pathname: './config'});
            })
    }

    openDir = () => {
        dialog.open({
            title: "Start new configurator",
            directory: true,
            multiple: false
        }).then((filePath) => {
            this.pathInput.current.value = filePath
        }).catch()
    }

    useFolder = async () => {
        let {helper} = this.context
        let folderPath = this.pathInput.current.value ? this.pathInput.current.value : this.pathInput.current.placeholder;
        helper.resolveHome(folderPath).then((homeResolvePath) => {
            fs.readDir(homeResolvePath)
                .then((files) => {
                    console.log("Directory exists.", files)
                    if (files.length > 0) {
                        confirm("Directory exists, overwrite it?")
                            .then((r) => {
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
        })
    }


    handleConfirm = (params) => {
        console.log(params)
    }


    render = () => {
        return (<Form>
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
                            <Button className="wel-btn" size="lg" onClick={this.useFolder}> Use this Folder </Button>
                        </div>
                    </td>
                    <td/>
                </tr>
                </tbody>
            </table>
        </Form>)
    }
}

StartNewConfigurationPanel.contextType = ACRNContext;

export default function (props) {
    const navigate = useNavigate();

    return <StartNewConfigurationPanel {...props} navigate={navigate}/>;
}