import _ from "lodash";
// import scenarioXSD from "../../schema/sliced.xsd";
import {Helper, LocalStorageBackend, TauriLocalFSBackend} from "./helper";
import {resolveHome} from "./common";

import React from "react";
import {path} from "@tauri-apps/api";
// import {initPyodide, convertXSD} from "./runpy";
import scenario from '../assets/schema/scenario.json'
// initPyodide().then((pyodide) => {
//     scenario = convertXSD(scenarioXSD)
//     console.log(scenario)
// })

const helper = new Helper(new LocalStorageBackend(), new TauriLocalFSBackend())

function ThrowError(errMsg) {
    alert(errMsg)
    throw new Error(errMsg)
}

class EventBase {
    constructor() {
        this.funRegister = {}
        this.funRegisterID = 0
    }

    register = (eventName, fun) => {
        if (this.funRegister.hasOwnProperty(eventName)) {
            this.funRegisterID++
            this.funRegister[eventName][this.funRegisterID] = fun
            return this.funRegisterID
        }
    }

    unregister = (eventName, funRegisterID) => {
        if (this.funRegister.hasOwnProperty(eventName)) {
            if (this.funRegister[eventName].hasOwnProperty(funRegisterID)) {
                delete this.funRegister[eventName][funRegisterID]
            }
        }
    }

}


export class XMLLayer extends EventBase {
    constructor() {
        super();
        this.funRegister = {
            onScenarioLoad: []
        }
    }

    #parseXML = (XMLText) => {
        return (new DOMParser()).parseFromString(XMLText, "text/xml")
    }

    #validateBoardXMLText = boardXMLText => {
        // call inside
        try {
            let boardXML = this.#parseXML(boardXMLText, "text/xml");
            return !!boardXML.querySelector("BIOS_INFO")
        } catch (e) {
            return false
        }
    }

    #validateScenarioXMLText = (scenarioXMLText) => {
        // call inside
        try {
            let scenarioXML = this.#parseXML(scenarioXMLText);
            return !!scenarioXML.querySelector("acrn-config")
        } catch (e) {
            return false
        }
    }

    loadBoard = async (boardXMLPath) => {
        // call by program
        let boardXMLText = await helper.read(await resolveHome(boardXMLPath))
        if (this.#validateBoardXMLText(boardXMLText)) {
            let PCIDevices = this.getPCIDevice(boardXMLText)
            return {boardXMLText, PCIDevices}
        } else {
            ThrowError('Board XML Error!')
        }
    }

    loadScenario = async (scenarioXMLPath) => {
        // call by program
        // load scenario data from xml file
        let scenarioXMLText = await helper.read(await resolveHome(scenarioXMLPath))
        if (!this.#validateScenarioXMLText(scenarioXMLText)) {
            ThrowError('Scenario XML Error!')
        }

        return helper.convertXMLTextToObj(scenarioXMLText)['acrn-config']
    }

    getPCIDevice = (boardXMLText) => {
        let pci_devices = this.#parseXML(boardXMLText).querySelector("PCI_DEVICE").textContent
        // Remove Region line
        pci_devices = pci_devices.replace(/Region.+\s+/g, '\n')
        // Remove Space
        pci_devices = pci_devices.replace(/[\n\t]+/g, '\n')
        // Split by \n
        pci_devices = pci_devices.split('\n')

        return _.uniq(pci_devices)
    }

    saveBoard = (boardFileWritePath, boardData) => {
        helper.save(boardFileWritePath, boardData)
    }

    saveScenario = (scenarioWritePath, scenarioData) => {
        // call by program
        console.log(scenarioData)
        const scenarioXML = helper.convertObjToXML({'acrn-config': scenarioData})
        console.log(scenarioXML)
        // debugger
        helper.save(scenarioWritePath, scenarioXML)
    }
}


export class ProgramLayer extends EventBase {
    constructor(instanceOfXMLLayer) {
        super()
        this.vmID = 0
        this.scenarioData = {}
        this.initScenario()
        this.xmlLayer = instanceOfXMLLayer
        this.funRegister = {
            scenarioDataUpdate: []
        }
    }

    initScenario = () => {
        this.vmID = 0
        this.scenarioData = {
            hv: {
                basic: {},
                advanced: {}
            },
            vm: {
                PRE_LAUNCHED_VM: [],
                SERVICE_VM: [],
                POST_LAUNCHED_VM: [],
            }
        }
    }

    onScenarioDataUpdateEvent() {
        this.funRegister.scenarioDataUpdate.map((f) => f())
    }

    newScenario = (preLaunchedVM, serviceVM, postLaunchedVM) => {
        // call by view
        this.initScenario()
        for (let i = 0; i < preLaunchedVM; i++) {
            this.addVM('PRE_LAUNCHED_VM')
        }
        for (let i = 0; i < serviceVM; i++) {
            this.addVM('SERVICE_VM')
        }
        for (let i = 0; i < postLaunchedVM; i++) {
            this.addVM('POST_LAUNCHED_VM')
        }
        this.onScenarioDataUpdateEvent()
    }


    addVM = (VMType, vmData = {}) => {
        // call by inside and view
        // if provide VMType and vmData at same time
        // function will set VMType to vmData
        let vm = vmData
        let usedVMID = false;

        // Todo: check vmData complete
        // check vmData
        if (!vm.hasOwnProperty('basic') || !vm.hasOwnProperty('advanced') || !vm.hasOwnProperty('hidden')) {
            if (!_.isEmpty(vm)) {
                console.warn('vmData is not empty but doesn\'t have correct struct')
            }
            vm = {basic: {}, advanced: {}, hidden: {}}
        }

        // check VMType
        let vmType = VMType;
        if (!_.isString(vmType) || _.isEmpty(vmType)) {
            // vmType is empty or not correct
            if (vm.hidden.hasOwnProperty('load_order')) {
                vmType = vm.hidden.load_order;
            } else {
                ThrowError('No VMType Set')
            }
        } else {
            if (vm.hidden.hasOwnProperty('load_order') && vm.hidden.load_order !== vmType) {
                console.warn("vmType and vmData provide load_order at same time, set vmData's load_order to vmType now")
            }
            vm.hidden.load_order = vmType
        }


        // check and validate vm name
        if (!vm.basic.hasOwnProperty('name') || !_.isString(vm.basic.name) || _.isEmpty(vm.basic.name)) {
            vm.basic.name = 'VM' + this.vmID
            usedVMID = true
        }

        // Check @id
        if (!vm.hasOwnProperty('@id')) {
            vm['@id'] = this.vmID
            usedVMID = true
        }

        // check VMID be used
        if (usedVMID) {
            this.vmID++
        }

        // add to config
        this.scenarioData.vm[vmType].push(vm)
        this.onScenarioDataUpdateEvent()
    }

    deleteVM = (vmID) => {
        // call by view
        for (let vmType in this.scenarioData.vm) {
            this.scenarioData.vm[vmType].map((vmConfig, vmIndex) => {
                if (vmConfig['@id'] === vmID) {
                    this.scenarioData.vm[vmType].splice(vmIndex, 1)
                }
            })
        }
        this.onScenarioDataUpdateEvent()
    }

    loadBoard = async (boardXMLPath) => {
        // call by view
        let {boardXMLText, PCIDevices} = await this.xmlLayer.loadBoard(boardXMLPath)

        // get new board file name
        let newBoardFileName = await path.basename(boardXMLPath)
        let cut = 0
        if (_.endsWith(newBoardFileName.toLowerCase(), '.xml')) {
            cut = '.xml'.length
        }
        if (_.endsWith(newBoardFileName.toLowerCase(), '.board.xml')) {
            cut = '.board.xml'.length
        }
        newBoardFileName = newBoardFileName.slice(0, newBoardFileName.length - cut)
        newBoardFileName = newBoardFileName + '.board.xml'

        // new board file save path
        const boardFileWritePath = await path.join(await resolveHome(WorkingFolder), newBoardFileName)

        // remove current working folder old Board File first
        await this.removeOldBoardFile()

        // save board file to working director
        this.xmlLayer.saveBoard(boardFileWritePath, boardXMLText)

        // get shownName
        let shownName = await path.join(WorkingFolder, newBoardFileName)
        return {shownName, boardXMLText, PCIDevices}
    }

    loadScenario = async (scenarioXMLPath) => {
        // call by view
        let scenarioConfig = await this.xmlLayer.loadScenario(scenarioXMLPath)
        this.initScenario()
        scenarioConfig.vm.map((vmConfig) => {
            let vmType = vmConfig.hidden.load_order
            if (!this.scenarioData.vm.hasOwnProperty(vmType)) {
                ThrowError('VMType ' + vmType + ' Does Not Exist')
            }
            this.addVM(vmType, vmConfig)
        })
        this.onScenarioDataUpdateEvent()
    }

    getOriginScenarioData = () => {
        // call by inside
        let originScenario = _.cloneDeep(this.scenarioData)
        originScenario.vm = originScenario.vm.PRE_LAUNCHED_VM.concat(
            originScenario.vm.SERVICE_VM,
            originScenario.vm.POST_LAUNCHED_VM
        )
        return originScenario
    }

    async removeOldBoardFile() {
        let files = await helper.list(await resolveHome(window.WorkingFolder))
        files.map((filename) => {
            if (_.endsWith(filename, '.board.xml')) {
                helper.remove(filename)
            }
        })
    }


    saveScenario = async () => {
        // call by view
        let originScenarioData = this.getOriginScenarioData()
        let filename = 'scenario.xml'
        let scenarioWritePath = await path.join(await resolveHome(window.WorkingFolder), filename)
        this.xmlLayer.saveScenario(scenarioWritePath, originScenarioData)
        // noinspection UnnecessaryLocalVariableJS
        let shownPath = await path.join(WorkingFolder, filename)
        return shownPath
    }

}

export class ACRNConfigurator extends EventBase {
    // get data from Program
    // convert it to view data
    constructor() {
        super()
        this.XMLLayer = new XMLLayer()
        this.programLayer = new ProgramLayer(this.XMLLayer)

        this.vmSchemas = this.Schemas()
        this.hvSchema = this.vmSchemas.HV
        delete this.vmSchemas.HV

        this.ivshmemEnum()
        this.programLayer.register("scenarioDataUpdate", this.ivshmemEnum)
    }

    ivshmemEnum = () => {
        let odata = this.programLayer.getOriginScenarioData()
        let vmNames = odata.vm.map((vmData) => {
            return vmData.basic.name
        })
        if (vmNames.length === 0) {
            vmNames = ['']
        }
        this.hvSchema.basic.definitions.VMNameType.enum = vmNames
    }


    loadBoard = async (boardXMLPath, callback) => {
        let {shownName, boardXMLText, PCIDevices} = await this.programLayer.loadBoard(boardXMLPath)
        scenario.definitions.PCIDevsConfiguration.properties.pci_dev.items.enum = PCIDevices
        Object.keys(this.vmSchemas).map((VMTypeKey) => {
            Object.keys(this.vmSchemas[VMTypeKey]).map((configLevelKey) => {
                this.vmSchemas[VMTypeKey][configLevelKey].definitions.PCIDevsConfiguration.properties.pci_dev.items.enum = PCIDevices
            })
        })
        callback(shownName, boardXMLText)
    }

    getHistory(mode) {
        return helper.getConfig(mode + 'History', [])
    }

    async addHistory(mode, filePath) {
        let history = await this.getHistory(mode);
        history.unshift(filePath)
        history = _.uniq(history)
        console.log(filePath, history)
        return await helper.setConfig(mode + 'History', history)
    }


    saveScenario = () => {
        let shownPath = this.programLayer.saveScenario()
        return this.addHistory('scenario', shownPath)
    }


    static #getSchema(prefix) {
        let basic = _.cloneDeep(scenario);
        let advanced = _.cloneDeep(scenario);

        basic.required = ["basic"]
        advanced.required = ["advanced"]

        basic.properties = {
            basic: {
                title: '',
                "$ref": "#/definitions/" + prefix + "BasicConfigType"
            }
        }
        advanced.properties = {
            advanced: {
                title: '',
                "$ref": "#/definitions/" + prefix + "AdvancedConfigType"
            }
        }
        return {basic, advanced}
    }

    Schemas() {
        let prefixData = {
            HV: 'HV',
            PRE_LAUNCHED_VM: 'PreLaunchedVM',
            SERVICE_VM: 'ServiceVM',
            POST_LAUNCHED_VM: 'PostLaunchedVM'
        }
        for (let key in prefixData) {
            prefixData[key] = ACRNConfigurator.#getSchema(prefixData[key])
        }
        return prefixData
    }

    log() {
        helper.log(...arguments)
    }
}


