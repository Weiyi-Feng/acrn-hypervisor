import React from "react";
import {Col, Container, Row} from "react-bootstrap";

import './Welcome.css'

import Banner from "../../components/Banner";

import StartNewConfigurationPanel from "./StartNewConfigurationPanel";
import UseAnExistingConfigurationPanel from "./UseAnExistingConfigurationPanel";
import Footer from "../../components/Footer";

class Welcome extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Container fluid>
                    <Banner>
                        <div className="banner-text ms-4 ps-3 py-4">
                            ACRN Configurator helps you set up and customize your ACRN hypervisor and VMs.
                        </div>
                    </Banner>
                    <Container fluid="xxl">
                        <Row className="py-4">
                            <Col className="d-flex justify-content-center border-end-sm" sm>
                                <div className="py-3 py-sm-0 px-3" style={{width: "100%"}}>
                                    <StartNewConfigurationPanel/>
                                </div>
                            </Col>

                            <Col className="d-flex justify-content-center" sm>
                                <div className="py-3 py-sm-0 px-3" style={{width: "100%"}}>
                                    <UseAnExistingConfigurationPanel/>
                                </div>
                            </Col>

                        </Row>

                    </Container>
                    <Footer/>
                </Container>
            </div>
        )
    }
}

export default Welcome
