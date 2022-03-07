import {CloseButton, Button, Modal} from "react-bootstrap";
import {useState} from "react";

export default function ExitACRNConfigurationModal(props) {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = (e) => {
        setShow(true);
        e.preventDefault()
    }

    return (
        <>
            <CloseButton className="wmb text-right me-3" variant="white" onClick={handleShow}/>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton closeVariant="white" className="bg-primary text-white">
                    <Modal.Title>Exit ACRN Configuration</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="p-4">
                        <b>ACRN Configuration files will be saved in the working folder:</b>
                        <p className="py-4 fs-4">
                            {window.WorkingFolder}
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="px-5 py-4 my-2">
                    <Button className="me-sm-2" variant="outline-primary" onClick={handleClose} size="lg"
                            style={{width: '137px'}}>
                        Cancel
                    </Button>
                    <Button className="me-sm-2" variant="outline-primary" onClick={() => {
                        console.log('exit without save')
                        window.close()
                    }} size="lg" style={{width: '237px'}}>
                        Discard Changes
                    </Button>
                    <Button variant="primary" onClick={() => {
                        acrnConfigurator.saveScenario().then(() => {
                            window.close()
                        })
                    }} size="lg" style={{width: '137px'}}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

