import React from "react";
import Button from "react-bootstrap/Button";
import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";
import { utils } from "@rjsf/core";
const { getDefaultRegistry } = utils;
const { fields, widgets } = getDefaultRegistry();
const DefaultChildren = () => (React.createElement("div", null,
    React.createElement(Button, { variant: "primary", type: "submit" }, "Submit")));
const Theme = {
    children: React.createElement(DefaultChildren, null),
    ArrayFieldTemplate,
    fields: { ...fields, ...Fields },
    FieldTemplate,
    ObjectFieldTemplate,
    widgets: { ...widgets, ...Widgets },
    ErrorList,
};
export default Theme;
//# sourceMappingURL=Theme.js.map