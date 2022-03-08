import React, {Component} from "react"
import Form from "../../../../lib/bs4rjsf"
import {IVSHMEM_VM} from "./IVSHMEM_VM/IVSHMEM_VM";

// import CustomTemplateField from "./CustomTemplateField/CustomTemplateField";

export class ConfigForm extends Component {
    constructor(props) {
        super(props);
    }

    setFormData = (data) => {
        let VMID = data['VMID']
        let mode = data['mode']

        if (VMID === -1) {
            acrnConfigurator.programLayer.scenarioData.hv[mode] = data[mode]
            return
        }

        let load_order = data['load_order']
        acrnConfigurator.programLayer.scenarioData.vm[load_order].map((vmConfig) => {
            if (vmConfig['@id'] === VMID) {
                vmConfig[mode] = data[mode]
            }
        })
    }


    getParams = (VMID, mode) => {
        let schema, formData = {VMID, mode};
        if (VMID === -1) {
            schema = acrnConfigurator.hvSchema[mode]
            formData[mode] = acrnConfigurator.programLayer.scenarioData.hv[mode]
        } else {
            let VMData = null;
            acrnConfigurator.programLayer.getOriginScenarioData().vm.map((vmConfig) => {
                if (vmConfig['@id'] === VMID) {
                    VMData = vmConfig
                }
            })
            schema = acrnConfigurator.vmSchemas[VMData.hidden.load_order][mode]
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
                                            VM_NAME: {"ui:grid": 6},
                                            VBDF: {"ui:grid": 6}
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

        let fields = {
            IVSHMEM_VM: IVSHMEM_VM
        }


        return <div>
            <Form
                noHtml5Validate={true}
                liveValidate={true}
                schema={params.schema}
                uiSchema={uiSchema}
                fields={fields}
                formData={params.formData}
                onChange={(e) => {
                    let data = e.formData
                    this.setFormData(data)
                }}
            />
        </div>
    }
}
