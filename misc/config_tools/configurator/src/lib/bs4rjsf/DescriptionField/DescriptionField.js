import React from "react";
const DescriptionField = ({ description }) => {
    if (description) {
        return React.createElement("div", null,
            React.createElement("div", { className: "mb-3" }, description));
    }
    return null;
};
export default DescriptionField;
//# sourceMappingURL=DescriptionField.js.map