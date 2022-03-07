import React from "react";
import {Container} from "react-bootstrap";

import {getURLParam} from "../../lib/common";

import "./Config.css"

import Banner from "../../components/Banner";

import backArrow from '../../assets/images/back_arrow_icon.svg'


// import ExitACRNConfigurationModal from "./ExitACRNConfigurationModal/ExitACRNConfigurationModal";
import ImportABoardConfigurationFile from "./ImportABoardConfigurationFile";
import CreateNewOrImportAnExistingScenario from "./CreateNewOrImportAnExistingScenario";
import ConfigureSettingsForScenario from "./ConfigureSettingsForScenario";

import {ACRNConfigurator} from "../../lib/acrn";
import Footer from "../../components/Footer";

class Config extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            WorkingFolder: props.WorkingFolder
        }
        window.WorkingFolder = props.WorkingFolder
        window.acrnConfigurator = new ACRNConfigurator()
    }

    render = () => {
        return (
            <div>
                <Container fluid className="configBody">
                    <Banner>
                        <div className="ms-4 ps-3 py-4 text-white d-flex align-items-center">
                            <img src={backArrow} className="pe-2" style={{cursor: 'pointer'}} alt="back to welcome page"
                                 onClick={() => {
                                     document.location.href = '#'
                                 }}/> Working folder: {this.state.WorkingFolder}
                        </div>
                    </Banner>

                    {/*<!-- stage 1 -->*/}
                    <ImportABoardConfigurationFile/>

                    {/*/!*<!-- stage 2 -->*!/*/}
                    <CreateNewOrImportAnExistingScenario/>

                    {/*<!-- stage 3 -->*/}
                    <ConfigureSettingsForScenario/>

                    <Footer/>
                </Container>
            </div>
        )
    };


}

export default (props) => {
    let WorkingFolder = getURLParam('WorkingFolder')
    return <Config {...props} WorkingFolder={WorkingFolder}/>
}
