import React from "react";
import {RouteProps} from "react-router-dom";

export interface TreeNodeComponentProps<T extends object> {
    nextNode(): void;

    rootNode(): void;

    previousNode(): void;
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

export interface TreeNodeInfo<T extends object> {
    children?: { [name: string]: TreeNodeInfo<T> };
    component: React.FC<TreeNodeComponentProps<T>>;
    routeProps?: RouteProps;
    options?: NodeOptions<T>;
}



export interface CompactTreeNodeInfo<T extends object> {
    component: TreeNodeInfo<T>["component"];
    routeProps: RouteProps;
    parent?: CompactTreeNodeInfo<T>;
    children: CompactTreeNodeInfo<T>[];
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

export interface TreeNodeProps<T extends object> {
    node: CompactTreeNodeInfo<T>;
}

export interface TreeStepsProps<T extends object> {
    root: TreeNodeInfo<T>;
    initialData: T;
    statePrefix?: string;
}

export interface ITreeContext {
    nextNode(options?: NextNodeOptions): void;

    rootNode(options?: NodeNavigationOptions): void;

    previousNode(options?: PreviousNodeOptions): void;
}

export interface NodeStackItem<T extends object> {
    id: string;
    node: CompactTreeNodeInfo<T>;
}