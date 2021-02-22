import React from "react";
import {RouteProps} from "react-router-dom";
import {CSSTransitionClassNames} from "react-transition-group/CSSTransition";

export interface ITreeStepsError<TError extends object> {
    error: TError | null;
    // Errors' live depends on the times the user has navigated
    ttl: number;
}

export interface TreeNodeComponentProps<T extends object, TError extends object = {}> {

    nextNode: ITreeContext<TError, T>['nextNode'];

    rootNode: ITreeContext<TError, T>['rootNode'];

    previousNode: ITreeContext<TError, T>['previousNode'];

    data: ITreeContext<TError, T>['data'];

    previousData: ITreeContext<TError, T>['previousData'];

    commit: ITreeContext<TError, T>['commit'];

    error: ITreeContext<TError, T>['error'];

    setError: ITreeContext<TError, T>['setError'];

}

export interface NodeOptions<T extends object> {
    // When the tree is rendered for the first time on a node that's different from the root node,
    // should be accessible?
    allowDirectAccess?: boolean;

    // When the nextNode of this node calls previousNode, should ignore this node and go to the previous one?
    ignoreAccessOfNextNode?: boolean;
    // When the previousNode of this node calls nextNode, should ignore this node and go to the next one?
    ignoreAccessOfPreviousNode?: boolean;
}

export interface TreeNodeInfo<TError extends object, T extends object> {
    children?: { [name: string]: TreeNodeInfo<TError, T> };
    component: React.FC<TreeNodeComponentProps<T, TError>>;
    routeProps?: RouteProps;
    options?: NodeOptions<T>;
}

export interface CompactTreeNodeInfo<TError extends object, T extends object> {
    component: TreeNodeInfo<TError, T>["component"];
    routeProps: RouteProps;
    parent?: CompactTreeNodeInfo<TError, T>;
    children: CompactTreeNodeInfo<TError, T>[];
    name: string;
    id: string;
    options: NodeOptions<T>;
}

export type NodeByNameOrIndex = {
    // How deep the node is located (default is 1)
    deep?: number;
    // number: Selects the first children of each node and the final child will be of index "child"
    // string: Selects the first children of each node and the final child will be of name "child"
    child?: string | number;
}

export type NodeByPath = {
    // Path to select the node
    // Array<number | string>: Selects index(number) or name(string) for each path;
    path: Array<number | string>;
}

export type NodeSelector = NodeByPath | NodeByNameOrIndex;

export interface NodeNavigationOptions {
    useReplace?: boolean;
}

export interface NextNodeOptions extends NodeNavigationOptions {
    selector?: NodeSelector;
}

export interface PreviousNodeOptions extends NodeNavigationOptions {
    // name or parent number (defaults to 1)
    parent?: number | string;
}

export interface TreeNodeProps<TError extends object, T extends object> {
    node: CompactTreeNodeInfo<TError, T>;
}


export interface TreeStepsProps<TError extends object, T extends object> {
    root: TreeNodeInfo<TError, T>;
    initialData: T;
    statePrefix?: string;

    transitionTimeout?: number | { appear?: number; enter?: number; exit?: number };
    transitionProps?: React.HTMLAttributes<HTMLDivElement>;
    transitionStyles?(goingBackwards: boolean):  string | CSSTransitionClassNames;
}

export interface ITreeContext<TError extends object, T extends object> {
    nextNode(options?: NextNodeOptions): null;

    rootNode(options?: NodeNavigationOptions): null;

    previousNode(options?: PreviousNodeOptions): null;

    data: T;

    previousData: T;

    commit(data: React.SetStateAction<T>): void;

    error: TError | null;
    setError(error: React.SetStateAction<TError | null>, ttl?: number): void;
}