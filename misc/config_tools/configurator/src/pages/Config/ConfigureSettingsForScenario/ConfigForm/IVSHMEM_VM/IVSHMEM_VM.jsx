import {Component} from "react";

export class IVSHMEM_VM extends Component {
    constructor(props) {
        super(props);
        this.state = {...props.formData};
    }

    onChange(name) {
        return (event) => {
            this.setState({
                [name]: parseFloat(event.target.value)
            }, () => this.props.onChange(this.state));
        };
    }

    render() {
        console.log(this.props)
        console.log(this.props.content, this.props.contents)
        return <textarea style={{width: "100%"}} defaultValue={JSON.stringify(this.props)}/>
    }

    render1 = () => {
        const {name, emulatedBy, size, sharedVMS} = this.state;
        return (<div style={{border: "1px solid green"}}>
            <table>
                <tbody>
                <tr>
                    <td>
                        Name:
                    </td>
                    <td>
                        <input type="text" value={name} onChange={this.onChange('name')}/>
                    </td>
                </tr>
                <tr>
                    <td>
                        Emulated by:
                    </td>
                    <td>

                        <select value={emulatedBy} onChange={this.onChange('emulatedBy')}>
                            <option value="Hypervisor">Hypervisor</option>
                            <option value="Device Model">Device Model</option>
                        </select>
                    </td>
                </tr>
                </tbody>
            </table>

        </div>)
    };
}

//
//
// class GeoPosition extends React.Component {
//
//
//     render() {
//         const {lat, lon} = this.state;
//         return (
//             <div>
//                 <input type="number" value={lat} onChange={this.onChange("lat")}/>
//                 <input type="number" value={lon} onChange={this.onChange("lon")}/>
//             </div>
//         );
//     }
// }
//
// // Define the custom field component to use for the root object
// const uiSchema = {"ui:field": "geo"};
//
// // Define the custom field components to register; here our "geo"
// // custom field component
// const fields = {geo: GeoPosition};
//
