import {createMemoryHistory} from "history";
import * as React from "react";
import {useHistory} from "react-router-dom";
import {
    NextNodeOptions,
    NodeNavigationOptions,
    PreviousNodeOptions,
    TreeNodeComponentProps,
    TreeNodeInfo,
} from "../types";

export const idata = {
    hallo: 0,
};
export const cmp = (
    txt: string,
    nextOptions: NextNodeOptions = {},
    previousOptions: PreviousNodeOptions = {},
    rootNodeOptions: NodeNavigationOptions = {},
) => (props: TreeNodeComponentProps<typeof idata>) => {
    const [r] = React.useState({renders: 0});
    const history = useHistory();
    const [count, setCount] = React.useState(0);

    r.renders += 1;
    return (
        <div id="noderoot">
            {txt}, Renders: {r.renders}, Count: {count}
            <br/>
            <button id={"decrement"} onClick={() => setCount((p) => p - 1)}>Decrement</button>
            <button id={"increment"} onClick={() => setCount((p) => p + 1)}>Increment</button>
            <br/>
            <button id={"previous-node"} onClick={() => props.previousNode(previousOptions)}>Previous node</button>
            <button id={"root-node"} onClick={() => props.rootNode(rootNodeOptions)}>Root node</button>
            <button id={"next-node"} onClick={() => props.nextNode(nextOptions)}>Next node</button>
            <button id={"go-back"} onClick={() => history.goBack()}>Go Back</button>
            <button id={"go-forward"} onClick={() => history.goForward()}>Go Forward</button>
        </div>
    );
};
export const _buildRoot = (cmps: { [k: string]: ReturnType<typeof cmp> }, cmpIds: string[], startIndex = 0): TreeNodeInfo<typeof idata> => {
    return {
        component: cmps[cmpIds[startIndex]],
        routeProps: {
            path: startIndex === 0 ? "/" : "/" + cmpIds[startIndex],
        },
        ...(startIndex + 1 >= cmpIds.length ? {} : {
            children: {
                [cmpIds[startIndex + 1]]: _buildRoot(cmps, cmpIds, startIndex + 1),
            },
        }),
    };
};


export const basicSetup = (ids = ["A", "B", "C"], onCmp?: (id: string, text: string) => ReturnType<typeof cmp> | void) => {
    const cmpIds = ids;
    const texts: { [k: string]: string } = {};
    for (const cmp of cmpIds) {
        texts[cmp] = "This is " + cmp;
    }
    const cmps: { [k: string]: ReturnType<typeof cmp> } = {};
    for (const _cmp of cmpIds) {
        if(typeof onCmp === 'function') {
            const tCmp = onCmp(_cmp, texts[_cmp]);
            if(tCmp) {
                cmps[_cmp] = tCmp;
                continue;
            }
        }
        cmps[_cmp] = cmp(texts[_cmp]);
    }

    const root = _buildRoot(cmps, cmpIds);
    const history = createMemoryHistory();
    return {
        root,
        history,
        cmpIds,
        cmps,
        texts,
    }
};

export const basicSetupTunnelNode =(ids = ["A", "B", "C"]) => {
    const {texts, cmpIds, root, history, cmps}  = basicSetup(ids);
    const sndChild = root?.children && root?.children[cmpIds[1]];
    if(sndChild) {
        sndChild.options = {
            ignoreAccessOfNextNode: true,
        };
        delete sndChild.routeProps;
    }
    return {
        texts,
        cmpIds,
        root,
        history,
        cmps
    }
};

export const basicSetup2Branches = (ids = ["A", "B", "C"], _2ids = ['xAx', 'xBx', 'xCx']) => {

    const {texts, cmpIds, root, history, cmps} = basicSetup(ids);
    let sndBranch = root;
    const cmps2: { [k: string]: ReturnType<typeof cmp> } = {};
    const _ids = _2ids;
    const _texts: { [k: string]: string } = {};
    for (const _cmp of _ids) {
        _texts[_cmp] = "This is " + _cmp;
        cmps2[_cmp] = cmp(_texts[_cmp]);
    }

    const _2ndBranchTarget = root?.children && root?.children[ids[1]].children;
    if (_2ndBranchTarget) {
        sndBranch = _buildRoot(cmps2, _ids);
        _2ndBranchTarget[_2ids[0]] = sndBranch;
    }

    return {
        texts,
        cmpIds,
        root,
        history,
        cmps,
        sndBranch,
        sndIds: _2ids,
        sndTexts: _texts,
    }
};
