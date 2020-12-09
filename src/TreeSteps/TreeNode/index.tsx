import React from "react";
import {TreeContext} from "../context";
import {ITreeContext, TreeNodeProps} from "../types";

export const TreeNode = <T extends object>({
    node,
}: React.PropsWithChildren<TreeNodeProps<T>>) => {
    const {nextNode, previousNode, rootNode} = React.useContext<ITreeContext>(
        TreeContext,
    );
    if (node) {
        const Component = node.component;
        return (
            <Component
                nextNode={nextNode}
                previousNode={previousNode}
                rootNode={rootNode}
            />
        );
    }
    return null;
};