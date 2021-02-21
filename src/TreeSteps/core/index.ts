import {History, LocationState} from "history";
import {matchPath} from "react-router-dom";
import {v4 as uuidv4} from "uuid";
import {
    CompactTreeNodeInfo,
    NextNodeOptions,
    NodeByNameOrIndex,
    NodeByPath,
    NodeSelector,
    PreviousNodeOptions,
    TreeNodeInfo,
} from "../types";

export enum AllowedOptions {
    TUNNEL = 1,
    PATH = 1 << 1,
    ALL = TUNNEL | PATH,
}

export const hasOption = (opt: AllowedOptions, opt2: AllowedOptions) => {
    return !!(opt & opt2);
};

export const isNodeAllowed = <T extends object, HistoryLocationState = LocationState, TError extends object = {}>(
    node: CompactTreeNodeInfo<TError, T>,
    history: History<HistoryLocationState>,
    options = AllowedOptions.ALL,
) => {
    if (hasOption(options, AllowedOptions.TUNNEL) && Object.keys(node.routeProps).length === 0) {
        // Tunnel node
        return true;
    }
    if (hasOption(options, AllowedOptions.PATH) &&
        history &&
        matchPath(history.createHref(history.location), node.routeProps)
    ) {
        return true;
    }
    return false;
};
export const findFirstValidNode = <T extends object,
    HistoryLocationState = LocationState, TError extends object = {}>(
    root: CompactTreeNodeInfo<TError, T>,
    history: History<HistoryLocationState>,
): CompactTreeNodeInfo<TError, T> | null => {
    for (const child of root.children || []) {
        const n = findFirstValidNode(child, history);
        if (n) {
            return n;
        }
    }
    if (root.options.allowDirectAccess) {
        if (isNodeAllowed(root, history, AllowedOptions.ALL & ~AllowedOptions.TUNNEL)) {
            return root;
        }
        if (root.parent) {
            return null;
        }
        return root;
    }
    return null;
};
export const buildCompactRoot = <T extends object, TError extends object>(
    root: TreeNodeInfo<TError, T>,
    name = "#root",
    parent?: CompactTreeNodeInfo<TError, T>,
): CompactTreeNodeInfo<TError, T> => {
    const children = [];
    const ref: any = {};
    if (root.children) {
        for (const name of Object.keys(root.children)) {
            children.push(buildCompactRoot(root.children[name], name, ref));
        }
    }
    ref.component = root.component;
    ref.routeProps = root.routeProps || {};
    ref.children = children;
    ref.name = name;
    ref.parent = parent;
    ref.id = uuidv4();
    ref.options = root.options || {};
    return ref;
};
export const findNode = <T extends object, TError extends object>(
    root: CompactTreeNodeInfo<TError, T>,
    id: string,
): CompactTreeNodeInfo<TError, T> | null => {
    if (root) {
        if (root.id === id) {
            return root;
        }
        for (const node of root.children) {
            const n = findNode(node, id);
            if (n) {
                return n;
            }
        }
    }
    return null;
};


const selectChildNode = <T extends object, TError extends object>(
    node: CompactTreeNodeInfo<TError, T> | null,
    options: NextNodeOptions,
    deep: number,
    maxDepth: number
): CompactTreeNodeInfo<TError, T> | null => {
    if (node) {
        if (options.selector) {
            if (options.selector.hasOwnProperty('path')) {
                const pathSelector = options.selector as NodeByPath;
                if (deep <= pathSelector.path.length) {
                    const target = pathSelector.path[deep - 1];
                    if (typeof target === 'string') {
                        return node.children.find(x => x.name === target) || null;
                    }
                    return node.children[target];
                }
            } else {
                const namedSelector = options.selector as NodeByNameOrIndex;
                if (namedSelector.child && deep === maxDepth) {
                    if (typeof namedSelector.child === 'string') {
                        return node.children.find(x => x.name === namedSelector.child) || null;
                    }
                    return node.children[namedSelector.child];
                } else {
                    return node.children[0];
                }
            }
        }
        return node.children[0];
    }
    return null;
};

const getMaxDeep = (selector?: NodeSelector): number => {
    if (selector) {
        if (selector.hasOwnProperty('path')) {
            const pathSelector = selector as NodeByPath;
            return pathSelector.path.length;
        }
        if (selector.hasOwnProperty('deep')) {
            const deepSelector = selector as NodeByNameOrIndex;
            if (typeof deepSelector.deep === 'number') {
                return deepSelector.deep;
            }
        }
    }
    return 1;
};

const _findNextNode = <T extends object, TError extends object>(
    maxDepth: number,
    node: CompactTreeNodeInfo<TError, T> | null,
    options: NextNodeOptions = {},
    deep = 1,
): CompactTreeNodeInfo<TError, T> | null => {
    if (node && node.children.length > 0) {
        const nextNode = selectChildNode(node, options, deep, maxDepth);
        if (nextNode && nextNode.options.ignoreAccessOfPreviousNode) {
            return _findNextNode(maxDepth, nextNode, options, deep);
        }
        if (deep < maxDepth) {
            return _findNextNode(maxDepth, nextNode, options, deep + 1);
        }
        return nextNode;
    }
    return null;
};

export const findNextNode = <T extends object, TError extends object>(
    node: CompactTreeNodeInfo<TError, T> | null,
    options: NextNodeOptions = {},
): CompactTreeNodeInfo<TError, T> | null => {
    return _findNextNode(getMaxDeep(options.selector), node, options);
};

export const findPreviousNode = <T extends object, TError extends object>(
    node: CompactTreeNodeInfo<TError, T> | null,
    options: PreviousNodeOptions = {},
): CompactTreeNodeInfo<TError, T> | null => {
    return _findPreviousNode(node, options)
};

export const _findPreviousNode = <T extends object, TError extends object>(
    node: CompactTreeNodeInfo<TError, T> | null,
    options: PreviousNodeOptions = {},
    deep = 1
): CompactTreeNodeInfo<TError, T> | null => {
    if (node && node.parent) {
        const previousNode = node.parent;
        if (previousNode.options.ignoreAccessOfNextNode) {
            return _findPreviousNode(previousNode, options, deep);
        }
        if(options.parent) {
            if((typeof options.parent === 'number' && deep < options.parent) ||
                (typeof options.parent === 'string' && previousNode.name !== options.parent)) {
                // Hasn't reached the target deep or name
                return _findPreviousNode(previousNode, options, deep + 1);
            }
        }
        return previousNode;
    }
    return null;
};

export const hasReferenceBackwards = <T extends object, TError extends object>(
    _from: CompactTreeNodeInfo<TError, T> | null,
    target: CompactTreeNodeInfo<TError, T> | null,
    ): boolean => {
    while(_from) {
        if(_from === target) {
            return true;
        }
        _from = _from.parent || null;
    }
    return false;
}