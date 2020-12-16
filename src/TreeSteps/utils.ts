import {TreeNodeInfo} from "./types";


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