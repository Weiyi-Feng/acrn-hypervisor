import React, {Component} from "react";
import {Button, Col, Form, Row} from "react-bootstrap";

import CreateScenarioModal from "./CreateScenarioModal/CreateScenarioModal";
import Banner from "../../../components/Banner";
import {dialog} from "@tauri-apps/api";

export default class CreateNewOrImportAnExistingScenario extends Component {
    constructor(props) {
        super(props);
        this.scenarioXMLSelect = React.createRef()
        this.scenarioXMLFileInput = React.createRef()
        this.state = {
            scenarioConfigFiles: [],
            stage: props.stage,
            scenarioName: '',
            scenarioConfig: {}
        }
    }

    componentDidMount() {
        this.scenarioHistoryUpdate()
    }

    scenarioHistoryUpdate() {
        return acrnConfigurator.getHistory('scenario').then((scenarioHistory) => {
            this.setState({scenarioConfigFiles: scenarioHistory})
        })
    }


    openFileDialog = () => {
        dialog.open({directory:false,multiple:false}).then(
            this.scenarioChange
        )
    }

    scenarioChange = (filepath) => {
        console.log(filepath)
        acrnConfigurator.addHistory('scenario', filepath).then(() => {
            this.scenarioHistoryUpdate().then(() => {
                this.scenarioXMLSelect.current.value = filepath
            })
        })
    }

    importScenario = () => {
        acrnConfigurator.programLayer.loadScenario(this.scenarioXMLSelect.current.value)
            .catch((reason) => {
                console.log(reason)
                alert(reason)
            })
    };

    render() {
        let scenarioHistorySelect = this.state.scenarioConfigFiles.map((optionValue, index) => {
            return (
                <option key={index} value={optionValue}>{optionValue}</option>
            )
        })
        return (<>
            <div className="p-3">
                <h3>2. Create new or import an existing scenario</h3>
            </div>
            <Row className="px-3 py-2">
                <Col className="border-end-sm py-1" sm>
                    <p className="py-2 d-none" style={{"letterSpacing": "0.49px"}}>Current scenario:
                        MySharedScenario.xml</p>
                    <div className="py-4 text-center">
                        <CreateScenarioModal/>
                    </div>
                </Col>

                <Col className="py-1 ps-sm-5" sm>
                    <Form>
                        <b className="d-block pb-3" style={{"letterSpacing": "-0.29px"}}>
                            Recently used scenarios:
                        </b>
                        <table>
                            <tbody>
                            <tr>
                                <td>
                                    <Form.Select className="d-inline" ref={this.scenarioXMLSelect}>
                                        {scenarioHistorySelect}
                                    </Form.Select>
                                    <input type="file" style={{display: 'none'}} ref={this.scenarioXMLFileInput}
                                           onChange={this.scenarioChange} onBlur={this.scenarioChange}/>
                                </td>
                                <td>
                                    <a className="ps-3 text-nowrap" style={{cursor: "pointer"}}
                                       onClick={this.openFileDialog}>
                                        Browse for scenario file…
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="py-4 text-right">
                                        <Button className="wel-btn" size="lg" onClick={this.importScenario}>Import
                                            Scenario</Button>
                                    </div>
                                </td>
                                <td/>
                            </tr>
                            </tbody>
                        </table>


                    </Form>
                </Col>
            </Row>
            <Banner/>
        </>)
    }
}
