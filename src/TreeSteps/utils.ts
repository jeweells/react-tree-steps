import {TransitionStyles, TreeNodeInfo} from "./types";


export const tunnelNode = <T extends object, TError extends object = {}>(
    component: TreeNodeInfo<TError, T>['component'],
    children?: TreeNodeInfo<TError, T>['children'],
    options?: TreeNodeInfo<TError, T>['options']): TreeNodeInfo<TError, T> => {
    return {
        component,
        children,
        routeProps: {},
        options: { ignoreAccessOfNextNode: true, ...(options || {}) },
    };
};

export const node = <T extends object, TError extends object = {}>(
    component: TreeNodeInfo<TError, T>['component'],
    path?: string | string[],
    children?: TreeNodeInfo<TError, T>['children'],
    options?: TreeNodeInfo<TError, T>['options']): TreeNodeInfo<TError, T>=> {
    return {
        component,
        routeProps: {
            path,
        },
        children,
        options,
    }
};
export const safeStyles = (styles: TransitionStyles = {}): Required<TransitionStyles> => {
    return {
        inStyles: styles.inStyles || {},
        outStyles: styles.outStyles || {},
        styles: styles.styles || {},
        classNames: styles.classNames || [],
        inClassNames: styles.inClassNames || [],
        outClassNames: styles.outClassNames || [],
    }
};