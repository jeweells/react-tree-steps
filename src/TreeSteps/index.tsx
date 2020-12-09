import {History, LocationState} from "history";
import React from "react";
import {matchPath} from "react-router";
import {TreeContext} from "./context";
import {buildCompactRoot, findFirstValidNode, findNextNode, findNode, findPreviousNode, isNodeAllowed} from "./core";
import {useChangingHistory} from "./core/hooks";
import {TreeNode} from "./TreeNode";
import {
    CompactTreeNodeInfo,
    NextNodeOptions,
    NodeNavigationOptions,
    PreviousNodeOptions,
    TreeStepsProps,
} from "./types";

export const TreeSteps = <T extends object>({
    root,
    initialData,
    statePrefix = "node:"
}: React.PropsWithChildren<TreeStepsProps<T>>) => {
    const history = useChangingHistory();

    const compactRoot = React.useMemo(() => buildCompactRoot(root), [root]);

    const [currentNode, setCurrentNode] = React.useState(() => {
        const _node = findFirstValidNode(compactRoot, history) || compactRoot;
        // Leave a mark that this node was visitted
        if(compactRoot === _node) {
            const _path = compactRoot.routeProps.path;
            history.replace({
                ...history.location,
                pathname: Array.isArray(_path) ? _path[0] : _path,
                state: statePrefix + _node.id
            });
        }
        else {
            history.replace({ ...history.location, state: statePrefix + _node.id });
        }
        return _node;
    });
    const currentNodeValidRef = React.useRef(currentNode);

    const goTo = React.useCallback(
        (node?: CompactTreeNodeInfo<T>, options: NodeNavigationOptions = {}) => {
            if (node && currentNode !== node) {
                const _path = node.routeProps.path;
                const path = Array.isArray(_path) ? _path[0] : _path;
                if (path) {
                    history[options.useReplace ? 'replace' : 'push']({
                        ...history.location,
                        pathname: path,
                        state: statePrefix + node.id
                    });
                }
                currentNodeValidRef.current = node;
                setCurrentNode(node);
            }
        },
        [history, currentNode]
    );

    const rootNode = React.useCallback((options: NodeNavigationOptions = {}) => {
        goTo(compactRoot, options);
    }, [compactRoot, goTo]);

    const nextNode = (options: NextNodeOptions = {}) => {
        const child = findNextNode(currentNode, options);
        if (child) {
            goTo(child, options);
        }
    };
    const previousNode = (options: PreviousNodeOptions = {}) => {
        const parent = findPreviousNode(currentNode, options);
        if(parent) {
            goTo(parent, options);
        }
        else {
            rootNode(options);
        }
    };

    const popHistoryRef = React.useRef<History.LocationListener<LocationState>>(
        () => null
    );
    popHistoryRef.current = (h, a) => {
        if (a === "POP") {
            if (h.state) {
                const targetState = String(h.state);
                if (targetState.startsWith(statePrefix)) {
                    const targetNode = findNode(
                        compactRoot,
                        targetState.substr(statePrefix.length)
                    );
                    if (targetNode && currentNode !== targetNode) {
                        currentNodeValidRef.current = targetNode;
                        setCurrentNode(targetNode);
                    }
                }
            }
        }
    };

    React.useMemo(() => {
        return history.listen((h, a) => {
            return popHistoryRef.current(h, a);
        });
    }, []);

    React.useEffect(() => {
        if (currentNodeValidRef.current === currentNode) {
            if (!isNodeAllowed(currentNode, history)) {
                rootNode({
                    useReplace: true,
                });
            }
        }
    }, [history, currentNode, rootNode]);


    return (
        <TreeContext.Provider
            value={{
                rootNode,
                previousNode,
                nextNode
            }}
        >
            <TreeNode node={currentNode} />
        </TreeContext.Provider>
    );
};
