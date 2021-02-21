import {createMemoryHistory} from "history";
import React from "react";
import {Router} from "react-router-dom";
import {TreeSteps} from "../TreeSteps";
import {TreeNodeComponentProps, TreeNodeInfo} from "../TreeSteps/types";
import "./treesteps.css";
const history = createMemoryHistory();
const idata = {
    hallo: 0
};

const cmp = (txt: string) => (props: TreeNodeComponentProps<typeof idata>) => {
    const [r] = React.useState({ renders: 0 });

    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        console.debug("[O]" + txt);
        return () => console.debug("[X]" + txt);
    }, []);
    r.renders += 1;
    return (
        <div style={{ background: txt === "A" ? "darkblue" : "darkred", width: "100%",
        height: txt === "A" ? 300 * (count + 1) : 600 * (count + 1),
                }}>
            {txt}, Renders: {r.renders}, Count: {count}
            <br />
            <button onClick={() => setCount((p) => p - 1)}>Decrement</button>
            <button onClick={() => setCount((p) => p + 1)}>Increment</button>
            <br />
            <button onClick={() => props.previousNode()}>Previous node</button>
            <button onClick={() => props.rootNode()}>Root node</button>
            <button onClick={() => props.nextNode()}>Next node</button>
        </div>
    );
};

type MyError = {
    message: string;
};
const root: TreeNodeInfo<MyError, typeof idata> = {
    component: cmp("A"),
    routeProps: {
        path: "/"
    },
    children: {
        b1: {
            component: cmp("B1"),
            routeProps: {
                path: "/b1"
            },
            children: {
                c1: {
                    component: cmp('C1'),
                    routeProps: {
                        path: "/b1/c1"
                    }
                }
            }
        },
        b2: {
            component: cmp("B2"),
            routeProps: {
                path: "/b2"
            }
        }
    }
};

export const Root: React.VFC = () =>
    <Router history={history}>
        <TreeSteps<typeof idata, MyError>
            root={root}
            initialData={idata}
            transitionProps={{
                timeout: {
                    exit: 500,
                },
                ignoreOnMounted: true,
            }}
            transitionStyles={(gb, state) => {

                return {
                    outClassNames: [{
                        ["node-b-fade"]: state.afterEnter,
                    }],
                    inClassNames: [{
                        ["node-a-fade"]: state.afterEnter,
                    }]
                }
            }}
        />
    </Router>;