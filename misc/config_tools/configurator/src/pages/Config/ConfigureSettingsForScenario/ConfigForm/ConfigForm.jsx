import React, {Component} from "react"
import Form from "../../../../lib/bs4rjsf"
import {ACRNContext} from "../../../../ACRNContext";
import SelectWidget from "./IVSHMEM_VM/SelectWidget";
import TextWidget from "./IVSHMEM_VM/TextWidget";

// import CustomTemplateField from "./CustomTemplateField/CustomTemplateField";

export class ConfigForm extends Component {
    constructor(props) {
        super(props);
    }

    setFormData = (data) => {
        let {configurator} = this.context
        let VMID = data['VMID']
        let mode = data['mode']

        if (VMID === -1) {
            configurator.programLayer.scenarioData.hv[mode] = data[mode]
            return
        }

        let load_order = data['load_order']
        configurator.programLayer.scenarioData.vm[load_order].map((vmConfig) => {
            if (vmConfig['@id'] === VMID) {
                vmConfig[mode] = data[mode]
            }
        })
    }


    getParams = (VMID, mode) => {
        let {configurator} = this.context
        let schema, formData = {VMID, mode};
        if (VMID === -1) {
            schema = configurator.hvSchema[mode]
            formData[mode] = configurator.programLayer.scenarioData.hv[mode]
        } else {
            let VMData = null;
            configurator.programLayer.getOriginScenarioData().vm.map((vmConfig) => {
                if (vmConfig['@id'] === VMID) {
                    VMData = vmConfig
                }
            })
            schema = configurator.vmSchemas[VMData.hidden.load_order][mode]
            formData[mode] = VMData[mode]
            formData['load_order'] = VMData.hidden.load_order
        }

        return {schema, formData}
    }


    render = () => {
        let VMID = this.props.VMID
        let mode = this.props.mode

        let params = this.getParams(VMID, mode)
        let uiSchema = {
            basic: {
                DEBUG_OPTIONS: {
                    BUILD_TYPE: {
                        "ui:widget": "radio"
                    }
                },
                FEATURES: {
                    IVSHMEM: {
                        IVSHMEM_REGION: {
                            items: {
                                IVSHMEM_VMS: {
                                    IVSHMEM_VM: {
                                        items: {
                                            VM_NAME: {
                                                "ui:grid": 7,
                                                "ui:widget": 'VM_NAME',
                                                "ui:descLabel": true,
                                                "ui:descLabelAli": 'H',
                                            },
                                            VBDF: {
                                                "ui:grid": 5,
                                                "ui:widget": 'VBDF',
                                                "ui:descLabel": true,
                                                "ui:descLabelAli": 'V',
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            additionalProperties: {
                "ui:widget": "hidden"
            }
        }

        let widgets = {
            VM_NAME: SelectWidget,
            VBDF: TextWidget
        }


        return <div>
            <Form
                noHtml5Validate={true}
                liveValidate={true}
                schema={params.schema}
                uiSchema={uiSchema}
                widgets={widgets}
                formData={params.formData}
                onChange={(e) => {
                    let data = e.formData
                    this.setFormData(data)
                }}
            />
        </div>
    }
}

ConfigForm.contextType = ACRNContext