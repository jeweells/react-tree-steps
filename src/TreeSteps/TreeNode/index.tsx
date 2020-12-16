import React from "react";
import {TreeContext} from "../context";
import {ITreeContext, TreeNodeProps} from "../types";

export const TreeNode = <TError extends object, T extends object>({
    node,
}: React.PropsWithChildren<TreeNodeProps<TError, T>>) => {
    const { ...cmpProps } = React.useContext<ITreeContext<TError, T>>(
        TreeContext,
    );
    if (node) {
        const Component = node.component;
        return (
            <Component {...cmpProps} />
        );
    }
    return null;
};