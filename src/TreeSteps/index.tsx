import {History, LocationState} from "history";
import React from "react";
import {TreeContext} from "./context";
import {buildCompactRoot, findFirstValidNode, findNextNode, findNode, findPreviousNode, isNodeAllowed} from "./core";
import {useChangingHistory} from "./core/hooks";
import {TreeNode} from "./TreeNode";
import {
    CompactTreeNodeInfo,
    ITreeStepsError,
    NextNodeOptions,
    NodeNavigationOptions,
    PreviousNodeOptions,
    TreeStepsProps,
} from "./types";

export const TreeSteps = <TError extends object = {}, T extends object = {}>({
    root,
    initialData,
    statePrefix = "node:",
}: React.PropsWithChildren<TreeStepsProps<TError, T>>) => {
    const history = useChangingHistory();
    const [nodeError, setNodeError] = React.useState<ITreeStepsError<TError>>({
        error: null,
        ttl: 0,
    });
    const compactRoot = React.useMemo(() => buildCompactRoot(root), [root]);

    const [dataMap, setDataMap] = React.useState<{ [nodeId: string]: T }>({});

    const getDataSafely = React.useCallback((map: typeof dataMap, node: CompactTreeNodeInfo<TError, T> | undefined) => {
        return (node ? map[node.id] : null) || initialData;
    }, [initialData]);

    const [currentNode, setCurrentNode] = React.useState(() => {
        const _node = findFirstValidNode(compactRoot, history) || compactRoot;
        // Leave a mark that this node was visitted
        if (compactRoot === _node) {
            const _path = compactRoot.routeProps.path;
            history.replace({
                ...history.location,
                pathname: Array.isArray(_path) ? _path[0] : _path,
                state: statePrefix + _node.id,
            });
        } else {
            history.replace({...history.location, state: statePrefix + _node.id});
        }
        return _node;
    });

    const commit = React.useCallback((data: React.SetStateAction<T>) => {
        setDataMap(prev => ({
            ...prev,
            [currentNode.id]: (data instanceof Function ? data(getDataSafely(prev, currentNode)) : data),
        }));
    }, [currentNode, dataMap, initialData]);

    const currentNodeValidRef = React.useRef(currentNode);

    const goTo = React.useCallback(
        (node?: CompactTreeNodeInfo<TError, T>, options: NodeNavigationOptions = {}) => {
            if (node && currentNode !== node) {
                const _path = node.routeProps.path;
                const path = Array.isArray(_path) ? _path[0] : _path;
                if (path) {
                    history[options.useReplace ? 'replace' : 'push']({
                        ...history.location,
                        pathname: path,
                        state: statePrefix + node.id,
                    });
                }
                currentNodeValidRef.current = node;
                setCurrentNode(node);
            }
        },
        [history, currentNode],
    );

    const rootNode = React.useCallback((options: NodeNavigationOptions = {}) => {
        goTo(compactRoot, options);
    }, [compactRoot, goTo]);

    const nextNode = (options: NextNodeOptions = {}) => {
        const child = findNextNode(currentNode, options);
        if (child) {
            // Children's data from the current node to the target node will be replaced by the current node's data
            // In order to "delegate the state to children"
            setDataMap(prev => {
                const dat = {
                    ...prev,
                };
                const currData = getDataSafely(prev, currentNode);
                let tmpChild = child as typeof child | undefined;
                // This has no overhead at all O(n) in the worst case and that case, which is not bad, will rarely happen
                // since it's more common to go to the next child ( the loop will break after the first iteration )
                while(tmpChild && tmpChild !== currentNode) {
                    dat[tmpChild.id] = currData;
                    tmpChild = tmpChild.parent;
                }
                return dat;
            });
            goTo(child, options);
        }
    };
    const previousNode = (options: PreviousNodeOptions = {}) => {
        const parent = findPreviousNode(currentNode, options);
        if (parent) {
            goTo(parent, options);
        } else {
            rootNode(options);
        }
    };

    const popHistoryRef = React.useRef<History.LocationListener<LocationState>>(
        () => null,
    );
    popHistoryRef.current = (h, a) => {
        if (a === "POP") {
            if (h.state) {
                const targetState = String(h.state);
                if (targetState.startsWith(statePrefix)) {
                    const targetNode = findNode(
                        compactRoot,
                        targetState.substr(statePrefix.length),
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
                nextNode,
                data: getDataSafely(dataMap, currentNode),
                commit,
                error: nodeError.error,
                setError(error: React.SetStateAction<TError | null>, ttl: number = 1) {
                    setNodeError(prev => ({
                        error: error instanceof Function ? error(prev.error) : error,
                        ttl,
                    }));
                }
            }}
        >
            <TreeNode node={currentNode}/>
        </TreeContext.Provider>
    );
};
