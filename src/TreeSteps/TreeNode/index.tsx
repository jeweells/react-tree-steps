import React from "react";
import {TreeContext} from "../context";
import {ITreeContext, TreeNodeProps} from "../types";

export const TreeNode = <TError extends object, T extends object>({
    node,
}: React.PropsWithChildren<TreeNodeProps<TError, T>>) => {
    const {nextNode, previousNode, rootNode, data, commit, setError, error} = React.useContext<ITreeContext<TError, T>>(
        TreeContext,
    );
    if (node) {
        const Component = node.component;
        return (
            <Component
                nextNode={nextNode}
                previousNode={previousNode}
                rootNode={rootNode}
                data={data}
                commit={commit}
                error={error}
                setError={setError}
            />
        );
    }
    return null;
};