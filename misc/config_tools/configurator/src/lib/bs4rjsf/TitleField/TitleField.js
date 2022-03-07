import React from "react";
const TitleField = ({ title, uiSchema }) => (React.createElement(React.Fragment, null,
    React.createElement("div", { className: "my-1" },
        React.createElement("h5", null, (uiSchema && uiSchema["ui:title"]) || title),
        React.createElement("hr", { className: "border-0 bg-secondary", style: { height: "1px" } }))));
export default TitleField;
//# sourceMappingURL=TitleField.js.map