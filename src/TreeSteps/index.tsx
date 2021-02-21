import classNames from "classnames";
import {History, LocationState} from "history";
import React from "react";
import {TreeContext} from "./context";
import {
    buildCompactRoot,
    findFirstValidNode,
    findNextNode,
    findNode,
    findPreviousNode,
    hasReferenceBackwards,
    isNodeAllowed,
} from "./core";
import {useChangingHistory} from "./core/hooks";
import {Transition} from "./Transition";
import {TreeNode} from "./TreeNode";
import {
    CompactTreeNodeInfo,
    ITreeStepsError,
    NextNodeOptions,
    NodeNavigationOptions,
    PreviousNodeOptions,
    TreeStepsProps,
} from "./types";
import {safeStyles} from "./utils";


export const TreeSteps = <T extends object = {}, TError extends object = {}>({
    root,
    initialData,
    statePrefix = "node:",
    transitionStyles,
    transitionProps = {},
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
    const [previousNodeCmp, setPreviousNodeCmp] = React.useState<CompactTreeNodeInfo<TError, T> | null>(null);
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
    }, [currentNode, getDataSafely]);

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
                setPreviousNodeCmp(currentNode);
                setCurrentNode(node);
            }
        },
        [history, currentNode],
    );

    const rootNode = React.useCallback((options: NodeNavigationOptions = {}) => {
        // Going root node cleans errors
        setNodeError({
            error: null,
            ttl: 0,
        });
        goTo(compactRoot, options);
        return null;
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
                while (tmpChild && tmpChild !== currentNode) {
                    dat[tmpChild.id] = currData;
                    tmpChild = tmpChild.parent;
                }
                return dat;
            });
            // Going next node cleans errors
            setNodeError({
                error: null,
                ttl: 0,
            });
            goTo(child, options);
        }
        return null;
    };
    const previousNode = (options: PreviousNodeOptions = {}) => {
        const parent = findPreviousNode(currentNode, options);
        if (parent) {
            // Going previous node reduces time to live (ttl) of an error
            setNodeError(prev => ({
                error: prev.ttl <= 0 ? null : prev.error,
                ttl: Math.max(prev.ttl - 1, 0),
            }));
            goTo(parent, options);
        } else {
            rootNode(options);
        }
        return null;
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
                        setPreviousNodeCmp(currentNode);
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

    const [delayedCurrentNode, setDelayedCurrentNode] = React.useState(currentNode);

    React.useLayoutEffect(() => {
        if (!delayedCurrentNode) {
            setDelayedCurrentNode(currentNode);
        }
    }, [currentNode]);
    const [goingBackwards, setGoingBackwards] = React.useState(false);

    React.useLayoutEffect(() => {
        setGoingBackwards(hasReferenceBackwards(delayedCurrentNode, currentNode));
    }, [currentNode]);

    return (
        <TreeContext.Provider
            value={{
                rootNode,
                previousNode,
                nextNode,
                previousData: getDataSafely(dataMap, currentNode && currentNode.parent),
                data: getDataSafely(dataMap, currentNode),
                commit,
                error: nodeError.error,
                setError(error: React.SetStateAction<TError | null>, ttl: number = 1) {
                    setNodeError(prev => ({
                        error: error instanceof Function ? error(prev.error) : error,
                        ttl,
                    }));
                },
            }}
        >
            <Transition
                timeout={0}
                {...transitionProps}
                id={currentNode.id}
                style={{
                    position: "relative",
                    ...transitionProps?.style,
                }}
                onExited={() => {
                    setDelayedCurrentNode(currentNode);
                    if(transitionProps?.onExited){
                        transitionProps.onExited();
                    }
                }}
            >
                {state => {
                    const styles = React.useMemo(() => safeStyles(transitionStyles && transitionStyles(goingBackwards, state)),
                        [state, goingBackwards]);
                    return (
                        <React.Fragment>
                            <div
                                className={classNames(...styles.classNames, ...(state.exited ? [] : styles.outClassNames))}
                                style={{
                                    zIndex: 2,
                                    width: "100%",
                                    height: "100%",
                                    ...styles.styles,
                                    ...(state.exited ? {} : styles.outStyles),
                                }}>
                                {<TreeNode node={delayedCurrentNode}/>}
                            </div>
                            {!state.exited && <div
                                className={classNames(...styles.inClassNames)}
                                style={{
                                    position: "absolute", top: 0, left: 0,
                                    zIndex: 1,
                                    width: "100%",
                                    height: "100%",
                                    ...styles.styles,
                                    ...styles.inStyles,
                                }}>
                                <TreeNode node={currentNode}/>
                            </div>}
                        </React.Fragment>)
                }}
            </Transition>
        </TreeContext.Provider>
    );
};
