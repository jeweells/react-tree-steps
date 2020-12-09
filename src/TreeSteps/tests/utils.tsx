import {createMemoryHistory} from "history";
import * as React from "react";
import {useHistory} from "react-router-dom";
import {TreeNodeComponentProps, TreeNodeInfo} from "../types";

export const idata = {
    hallo: 0,
};
export const cmp = (txt: string) => (props: TreeNodeComponentProps<typeof idata>) => {
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
            <button id={"previous-node"} onClick={() => props.previousNode()}>Previous node</button>
            <button id={"root-node"} onClick={() => props.rootNode()}>Root node</button>
            <button id={"next-node"} onClick={() => props.nextNode()}>Next node</button>
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


export const basicSetup = () => {
    const cmpIds = ["A", "B", "C"];
    const texts: { [k: string]: string } = {};
    for (const cmp of cmpIds) {
        texts[cmp] = "This is " + cmp;
    }
    const cmps: { [k: string]: ReturnType<typeof cmp> } = {};
    for (const _cmp of cmpIds) {
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
