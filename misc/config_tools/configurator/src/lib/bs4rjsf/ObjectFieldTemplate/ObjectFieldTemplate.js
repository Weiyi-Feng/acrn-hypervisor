import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { utils } from "@rjsf/core";
import AddButton from "../AddButton/AddButton";
const { canExpand } = utils;
const ObjectFieldTemplate = ({ DescriptionField, description, TitleField, title, properties, required, uiSchema, idSchema, schema, formData, onAddClick, disabled, readonly, }) => {
    let noRowFlag = false;
    let content = properties.map((element, index) => {
        if (uiSchema && uiSchema[element.name] && uiSchema[element.name].hasOwnProperty('ui:grid')) {
            noRowFlag = true;
        }
        return (React.createElement(Col, { key: index, style: { marginBottom: "10px" }, className: element.hidden ? "d-none" : undefined, xs: (uiSchema[element.name] && uiSchema[element.name]['ui:grid']) ?
                uiSchema[element.name]['ui:grid'] :
                12 }, element.content));
    });
    let inContent;
    if (!noRowFlag) {
        inContent = React.createElement(Row, null, content);
    }
    else {
        inContent = content;
    }
    let expand = canExpand(schema, uiSchema, formData) ? (React.createElement(Row, null,
        React.createElement(Col, { xs: { offset: 9, span: 3 }, className: "py-4" },
            React.createElement(AddButton, { onClick: onAddClick(schema), disabled: disabled || readonly, className: "object-property-expand" })))) : null;
    let container = React.createElement(Container, { fluid: true, className: "p-0" },
        React.createElement(Row, null, content),
        expand);
    return (React.createElement(React.Fragment, null,
        (uiSchema["ui:title"] || title) && (React.createElement(TitleField, { id: `${idSchema.$id}-title`, title: uiSchema["ui:title"] || title, required: required })),
        description && (React.createElement(DescriptionField, { id: `${idSchema.$id}-description`, description: description })),
        container));
};
export default ObjectFieldTemplate;
//# sourceMappingURL=ObjectFieldTemplate.js.map