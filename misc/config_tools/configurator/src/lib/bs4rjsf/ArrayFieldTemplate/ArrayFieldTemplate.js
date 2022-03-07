import React from "react";
import { utils } from "@rjsf/core";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";
const { isMultiSelect, getDefaultRegistry } = utils;
const ArrayFieldTemplate = (props) => {
    const { schema, registry = getDefaultRegistry() } = props;
    if (isMultiSelect(schema, registry.rootSchema)) {
        return React.createElement(DefaultFixedArrayFieldTemplate, { ...props });
    }
    else {
        return React.createElement(DefaultNormalArrayFieldTemplate, { ...props });
    }
};
const ArrayFieldTitle = ({ TitleField, idSchema, title, required, }) => {
    if (!title) {
        return null;
    }
    const id = `${idSchema.$id}__title`;
    return React.createElement(TitleField, { id: id, title: title, required: required });
};
const ArrayFieldDescription = ({ DescriptionField, idSchema, description, }) => {
    if (!description) {
        return null;
    }
    const id = `${idSchema.$id}__description`;
    return React.createElement(DescriptionField, { id: id, description: description });
};
// Used in the two templates
const DefaultArrayItem = (props) => {
    const btnStyle = {
        flex: 1,
        paddingLeft: 6,
        paddingRight: 6,
        fontWeight: "bold",
    };
    return (React.createElement("div", { key: props.key },
        React.createElement(Row, { className: "mb-2  d-flex align-items-center" },
            React.createElement(Col, { xs: "9", lg: "9" }, props.children),
            React.createElement(Col, { xs: "3", lg: "3", className: "py-4" }, props.hasToolbar && (React.createElement("div", { className: "d-flex flex-row" },
                (props.hasMoveUp || props.hasMoveDown) && (React.createElement("div", { className: "m-0 p-0" },
                    React.createElement(IconButton, { icon: "arrow-up", className: "array-item-move-up", tabIndex: -1, style: btnStyle, disabled: props.disabled || props.readonly || !props.hasMoveUp, onClick: props.onReorderClick(props.index, props.index - 1) }))),
                (props.hasMoveUp || props.hasMoveDown) && (React.createElement("div", { className: "m-0 p-0" },
                    React.createElement(IconButton, { icon: "arrow-down", tabIndex: -1, style: btnStyle, disabled: props.disabled || props.readonly || !props.hasMoveDown, onClick: props.onReorderClick(props.index, props.index + 1) }))),
                props.hasRemove && (React.createElement("div", { className: "m-0 p-0" },
                    React.createElement(IconButton, { icon: "remove", tabIndex: -1, style: btnStyle, disabled: props.disabled || props.readonly, onClick: props.onDropIndexClick(props.index) })))))))));
};
const DefaultFixedArrayFieldTemplate = (props) => {
    return (React.createElement("fieldset", { className: props.className },
        React.createElement(ArrayFieldTitle, { key: `array-field-title-${props.idSchema.$id}`, TitleField: props.TitleField, idSchema: props.idSchema, title: props.uiSchema["ui:title"] || props.title, required: props.required }),
        (props.uiSchema["ui:description"] || props.schema.description) && (React.createElement("div", { className: "field-description", key: `field-description-${props.idSchema.$id}` }, props.uiSchema["ui:description"] || props.schema.description)),
        React.createElement("div", { className: "row array-item-list", key: `array-item-list-${props.idSchema.$id}` }, props.items && props.items.map(DefaultArrayItem)),
        props.canAdd && (React.createElement(AddButton, { className: "array-item-add", onClick: props.onAddClick, disabled: props.disabled || props.readonly }))));
};
const DefaultNormalArrayFieldTemplate = (props) => {
    return (React.createElement("div", null,
        React.createElement(Row, { className: "p-0 m-0" },
            React.createElement(Col, { className: "p-0 m-0" },
                React.createElement(ArrayFieldTitle, { key: `array-field-title-${props.idSchema.$id}`, TitleField: props.TitleField, idSchema: props.idSchema, title: props.uiSchema["ui:title"] || props.title, required: props.required }),
                (props.uiSchema["ui:description"] || props.schema.description) && (React.createElement(ArrayFieldDescription, { key: `array-field-description-${props.idSchema.$id}`, DescriptionField: props.DescriptionField, idSchema: props.idSchema, description: props.uiSchema["ui:description"] || props.schema.description })),
                React.createElement(Container, { fluid: true, key: `array-item-list-${props.idSchema.$id}`, className: "p-0 m-0" },
                    props.items && props.items.map(p => DefaultArrayItem(p)),
                    props.canAdd && (React.createElement(Container, { className: "" },
                        React.createElement(Row, { className: "mt-2" },
                            React.createElement(Col, { xs: 9 }),
                            React.createElement(Col, { xs: 3, className: "py-4 col-lg-3 col-3" },
                                " ",
                                React.createElement(AddButton, { className: "array-item-add", onClick: props.onAddClick, disabled: props.disabled || props.readonly }))))))))));
};
export default ArrayFieldTemplate;
//# sourceMappingURL=ArrayFieldTemplate.js.map