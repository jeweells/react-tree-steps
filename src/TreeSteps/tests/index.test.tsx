import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {configure, mount, render, shallow, ShallowWrapper} from "enzyme";
import * as React from "react";
import {act} from "react-dom/test-utils";
import {Router, useHistory} from "react-router-dom";
import {TreeSteps} from "../index";
import {createMemoryHistory} from "history";
import {NextNodeOptions, PreviousNodeOptions, TreeNodeComponentProps, TreeNodeInfo} from "../types";
import {_buildRoot, basicSetup, basicSetup2Branches, cmp, idata} from "./utils";



configure({adapter: new Adapter()});



it("Should render one component", () => {
    const textCmpA = "This is A";
    const cmpA = cmp(textCmpA);
    const root: TreeNodeInfo<typeof idata> = {
        component: cmpA,
        routeProps: {
            path: "/",
        },
    };
    const history = createMemoryHistory();

    const tree = render(
        <Router history={history}>
            <TreeSteps root={root} initialData={idata}/>
        </Router>,
    );
    const text = tree.text();
    expect(text).toContain(textCmpA);
    expect(text).toContain("Renders: 1");
    expect(tree).toMatchSnapshot();
});


describe("Going all the way to next and then previous node should work", () => {
    const {texts, cmpIds, root, history} = basicSetup();
    const tree = mount(
        <Router history={history}>
            <TreeSteps root={root} initialData={idata}/>
        </Router>,
    );
    it("Going all the way to next nodes", () => {
        for (const cmpId of cmpIds) {
            const text = tree.text();
            expect(text).toContain(texts[cmpId]);
            expect(text).toContain("Renders: 1");
            tree.find("#next-node").simulate('click');
        }
    });

    it("Going all the way to previous nodes", () => {
        for (const cmpId of cmpIds.reverse()) {
            const text = tree.text();
            expect(text).toContain(texts[cmpId]);
            expect(text).toContain("Renders: 1");
            tree.find("#previous-node").simulate('click');
        }
    })
});


describe("Going all the way to next and then using history.goBack/goForward should work", () => {
    const {texts, cmpIds, root, history} = basicSetup();
    const tree = mount(
        <Router history={history}>
            <TreeSteps root={root} initialData={idata}/>
        </Router>,
    );
    it("Going all the way to next nodes", () => {
        for (const cmpId of cmpIds) {
            const text = tree.text();
            expect(text).toContain(texts[cmpId]);
            expect(text).toContain("Renders: 1");
            tree.find("#next-node").simulate('click');
        }
    });
    // History changes render twice (1 when history changes, 1 when nodes are recalculated)
    it("Going all the way to previous nodes (history.goBack)", async () => {
        for (const cmpId of cmpIds.reverse()) {
            const text = tree.text();
            expect(text).toContain(texts[cmpId]);
            expect(text).toMatch(/Renders: [21]/);
            tree.find("#go-back").simulate('click');
        }
    });

    it("Going all the way to next nodes (history.goForward)", async () => {
        // .reverse() is made in place
        for (const cmpId of cmpIds.reverse()) {
            const text = tree.text();
            expect(text).toContain(texts[cmpId]);
            expect(text).toMatch(/Renders: [21]/);
            tree.find("#go-forward").simulate('click');
        }
    })
});

describe("Testing direct access option", () => {

    it("Accessing a not allowed node should redirect to root node", () => {
        const {texts, cmpIds, root, history} = basicSetup();
        history.push("/" + cmpIds[1]);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        const text = tree.text();
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    });

    it("Accessing an allowed node should render it", () => {
        const {texts, cmpIds, root, history} = basicSetup();
        history.push("/" + cmpIds[1]);
        // @ts-ignore
        root.children[cmpIds[1]].options = { allowDirectAccess: true };
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        const text = tree.text();
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
        expect(text).toContain(texts[cmpIds[1]]);
    });

});



describe("Testing next node options", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const performWithOptions = (options: NextNodeOptions) => {
        const {texts, cmpIds, root, history} = basicSetup(ids);
        root.component = cmp(texts[cmpIds[0]], options);

        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        return {
            texts, cmpIds, root, history,
            text,
        }
    };

    it("Next node with deep 2", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 2
            }
        });
        expect(text).toContain(texts[cmpIds[2]]);
        expect(history.location.pathname).toBe("/" + cmpIds[2]);
    });


    it("Next node with invalid deep (should not change)", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 100
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    });

    it("Next node with name", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 5 - 1,
                child: "E"
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[cmpIds.length - 1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 1]);
    });


    it("Next node with invalid name (should not change)", () => {
        // Deep will be 1, you cannot write a name for all children nodes, the behaviour will be undetermined
        // since it's not verified two nodes won't have the same name
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: "E"
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    });


    it("Next 3rd node with full name path", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: ids.slice(1, 4)
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    });

    it("Next 3rd node with mixed path", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0, ids[2], 0]
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    });


    it("Next 3rd node with number path", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0, 0, 0]
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    });


    it("Next node with deep 1", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 1
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    });

    it("Next node with child 0", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: 0
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    });

    it("Next node with named child", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: ids[1]
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    });

    it("Next node with full named path", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [ids[1]]
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    });

    it("Next node with number path", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0]
            }
        });
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    });


    it("Next nodes with 2 branches and full named path", () => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    cmpIds[1],
                    ...sndIds.slice(0, 2),
                ]
            }
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    });

    it("Next nodes with 2 branches and full number path", () => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    1,
                    0,
                ]
            }
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    });


    it("Next nodes with 2 branches and mixed path", () => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    sndIds[0],
                    0,
                ]
            }
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    });

    it("Next nodes with 2 branches with invalid path", () => {
        const {texts, cmpIds, root, history, sndIds} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    "asdasdsad",
                    0,
                ]
            }
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/" );
    });

});


describe("Testing previous node options", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const performWithOptions = (options: PreviousNodeOptions) => {
        const {texts, cmpIds, root, history} = basicSetup(ids, (_id, _text) => {
            if(_id === ids[ids.length - 1]) {
                return cmp(_text, {}, options)
            }
        });
        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: ids.slice(1)
            }
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );

        tree.find("#next-node").simulate('click');
        // Make sure we chose the last component
        expect(tree.text()).toContain(texts[cmpIds[cmpIds.length - 1]]);
        tree.find("#previous-node").simulate('click');
        const text = tree.text();
        return {
            texts, cmpIds, root, history,
            text,
        }
    };

    it("Previous node with parent 2", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            parent: 2
        });
        expect(text).toContain(texts[cmpIds[cmpIds.length - 3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 3]);
    });

    it("Previous node with named parent", () => {
        const {text, history, cmpIds, texts} = performWithOptions({
            parent: ids[ids.length - 3]
        });
        expect(text).toContain(texts[cmpIds[cmpIds.length - 3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 3]);
    });
});