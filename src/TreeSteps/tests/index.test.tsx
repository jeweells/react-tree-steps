import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {configure, mount, render} from "enzyme";
import {createMemoryHistory} from "history";
import * as React from "react";
import {act} from "react-dom/test-utils";
import {Router} from "react-router-dom";
import {TreeSteps} from "../index";
import {NextNodeOptions, PreviousNodeOptions, TreeNodeInfo} from "../types";
import {basicSetup, basicSetup2Branches, basicSetupTunnelNode, cmp, idata} from "./utils";


configure({adapter: new Adapter()});


it("Should render one component", () => {
    const textCmpA = "This is A";
    const cmpA = cmp(textCmpA);
    const root: TreeNodeInfo<{}, typeof idata> = {
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
        root.children[cmpIds[1]].options = {allowDirectAccess: true};
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

    const nextNodeWithDeep2 = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 2,
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toContain(texts[cmpIds[2]]);
        expect(history.location.pathname).toBe("/" + cmpIds[2]);
    };

    it("Next node with deep 2", () => nextNodeWithDeep2());
    it("Next node with deep 2 and useReplace", () => nextNodeWithDeep2(true));

    const nextNodeWithInvalidDeep = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 100,
            },
            useReplace,
        });
        expect(history.entries.length).toBe(1);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    };

    it("Next node with invalid deep (should not change)", () => nextNodeWithInvalidDeep());
    it("Next node with invalid deep and useReplace (should not change)", () => nextNodeWithInvalidDeep(true));

    const nextNodeWithName = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: ids.length - 1,
                child: "E",
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[cmpIds.length - 1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 1]);
    };

    it("Next node with name", () => nextNodeWithName());
    it("Next node with name and useReplace", () => nextNodeWithName(true));

    const nextNodeWithInvalidName = (useReplace?: boolean) => {
        // Deep will be 1, you cannot write a name for all children nodes, the behaviour will be undetermined
        // since it's not verified two nodes won't have the same name
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: "E",
            },
            useReplace,
        });
        expect(history.entries.length).toBe(1);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    };
    it("Next node with invalid name (should not change)", () => nextNodeWithInvalidName());
    it("Next node with invalid name and useReplace (should not change)",
        () => nextNodeWithInvalidName(true));

    const next3rdNodeWithFullNamePath = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: ids.slice(1, 4),
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    };

    it("Next 3rd node with full name path", () => next3rdNodeWithFullNamePath());
    it("Next 3rd node with full name path and useReplace", () => next3rdNodeWithFullNamePath(true));

    const next3rdNodeWithMixedPath = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0, ids[2], 0],
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    };

    it("Next 3rd node with mixed path", () => next3rdNodeWithMixedPath());
    it("Next 3rd node with mixed path", () => next3rdNodeWithMixedPath(true));

    const next3rdNodeWithNumberPath = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0, 0, 0],
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[3]);
    };
    it("Next 3rd node with number path", () => next3rdNodeWithNumberPath());
    it("Next 3rd node with number path and useReplace", () => next3rdNodeWithNumberPath(true));

    const nextNodeWithDeep1 = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                deep: 1,
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    };

    it("Next node with deep 1", () => nextNodeWithDeep1());
    it("Next node with deep 1 and useReplace", () => nextNodeWithDeep1(true));

    const nextNodeWithChild0 = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: 0,
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    };
    it("Next node with child 0", () => nextNodeWithChild0());
    it("Next node with child 0 and useReplace", () => nextNodeWithChild0(true));
    const nextNodeWithNamedChild = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                child: ids[1],
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    };
    it("Next node with named child", () => nextNodeWithNamedChild());
    it("Next node with named child and useReplace", () => nextNodeWithNamedChild(true));

    const nextNodeWithFullNamedPath = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [ids[1]],
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    };

    it("Next node with full named path", () => nextNodeWithFullNamedPath());
    it("Next node with full named path and useReplace", () => nextNodeWithFullNamedPath(true));

    const nextNodeWithNumberPath = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            selector: {
                path: [0],
            },
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
        expect(history.location.pathname).toBe("/" + cmpIds[1]);
    };

    it("Next node with number path", () => nextNodeWithNumberPath());
    it("Next node with number path and useReplace", () => nextNodeWithNumberPath(true));

    const nextNodesWith2BranchesAndFullNamedPath = (useReplace?: boolean) => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    cmpIds[1],
                    ...sndIds.slice(0, 2),
                ],
            },
            useReplace,
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    };
    it("Next nodes with 2 branches and full named path", () => nextNodesWith2BranchesAndFullNamedPath());
    it("Next nodes with 2 branches and full named path and useReplace",
        () => nextNodesWith2BranchesAndFullNamedPath(true));
    const nextNodesWith2BranchesAndFullNumberPath = (useReplace?: boolean) => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    1,
                    0,
                ],
            },
            useReplace,
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    };
    it("Next nodes with 2 branches and full number path", () => nextNodesWith2BranchesAndFullNumberPath());
    it("Next nodes with 2 branches and full number path and useReplace",
        () => nextNodesWith2BranchesAndFullNumberPath(true));

    const nextNodesWith2BranchesAndMixedPath = (useReplace?: boolean) => {
        const {texts, cmpIds, root, history, sndIds, sndTexts} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    sndIds[0],
                    0,
                ],
            },
            useReplace,
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(history.entries.length).toBe(useReplace ? 1 : 2);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(sndTexts[sndIds[1]]);
        expect(history.location.pathname).toBe("/" + sndIds[1]);
    };
    it("Next nodes with 2 branches and mixed path", () => nextNodesWith2BranchesAndMixedPath());
    it("Next nodes with 2 branches and mixed path and useReplace",
        () => nextNodesWith2BranchesAndMixedPath(true));

    const nextNodesWith2BranchesWithInvalidPath = (useReplace?: boolean) => {
        const {texts, cmpIds, root, history, sndIds} = basicSetup2Branches(ids);

        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: [
                    0,
                    "asdasdsad",
                    0,
                ],
            },
            useReplace,
        });
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(history.entries.length).toBe(1);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
        expect(history.location.pathname).toBe("/");
    };
    it("Next nodes with 2 branches with invalid path", () => nextNodesWith2BranchesWithInvalidPath());
    it("Next nodes with 2 branches with invalid path and useReplace",
        () => nextNodesWith2BranchesWithInvalidPath(true));

});


describe("Testing previous node options", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const performWithOptions = (options: PreviousNodeOptions) => {
        const {texts, cmpIds, root, history} = basicSetup(ids, (_id, _text) => {
            if (_id === ids[ids.length - 1]) {
                return cmp(_text, {}, options)
            }
        });
        root.component = cmp(texts[cmpIds[0]], {
            selector: {
                path: ids.slice(1),
            },
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

    const previousNodeWithParent2 = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            parent: 2,
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 2 : 3);
        expect(text).toContain(texts[cmpIds[cmpIds.length - 3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 3]);
    };

    it("Previous node with parent 2", () => previousNodeWithParent2());
    it("Previous node with parent 2", () => previousNodeWithParent2(true));

    const previousNodeWithNamedParent = (useReplace?: boolean) => {
        const {text, history, cmpIds, texts} = performWithOptions({
            parent: ids[ids.length - 3],
            useReplace,
        });
        expect(history.entries.length).toBe(useReplace ? 2 : 3);
        expect(text).toContain(texts[cmpIds[cmpIds.length - 3]]);
        expect(history.location.pathname).toBe("/" + cmpIds[cmpIds.length - 3]);
    };

    it("Previous node with named parent", () => previousNodeWithNamedParent());
    it("Previous node with named parent and useReplace", () => previousNodeWithNamedParent(true));
});


describe("Testing tunnel nodes", () => {
    const ids = ["A", "B", "C"];
    const perform = () => {
        const {root, cmps, texts, cmpIds, history} = basicSetupTunnelNode(ids);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );

        tree.find("#next-node").simulate('click');
        return {
            root, cmps, texts, cmpIds, history,
            tree,
            text: tree.text(),
        }
    };
    it("Going next node should not update history", () => {
        const {history, texts, text, cmpIds} = perform();
        expect(history.entries.length).toBe(1);
        expect(history.location.pathname).toBe("/");
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[1]]);
    });

    it("Updating node's content should keep the same node mounted", () => {
        const {history, texts, cmpIds, tree} = perform();
        tree.find("#increment").simulate('click');
        tree.find("#increment").simulate('click');
        const text = tree.text();
        expect(history.location.pathname).toBe("/");
        expect(text).toMatch(/Renders: 3/);
        expect(text).toContain(texts[cmpIds[1]]);
    });

    it("Going next node of the previous node should work", () => {
        const {history, texts, cmpIds, tree} = perform();
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(history.location.pathname).toBe("/" + cmpIds[2]);
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[2]]);
    });

    it("Going previous node of the tunnel node should work", () => {
        const {history, texts, cmpIds, tree} = perform();
        tree.find("#previous-node").simulate('click');
        const text = tree.text();
        expect(history.location.pathname).toBe("/");
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
    });


    it("Trying accessing a tunnel node from the next node should skip the tunnel node", () => {
        const {history, texts, cmpIds, tree} = perform();
        tree.find("#next-node").simulate('click');
        tree.find("#previous-node").simulate('click');
        const text = tree.text();
        expect(history.location.pathname).toBe("/");
        expect(text).toMatch(/Renders: 1/);
        expect(text).toContain(texts[cmpIds[0]]);
    });

});


describe("Commit data", () => {
    const ids = ["A", "B", "C"];

    const perform = () => {
        const {texts, cmpIds, root, history} = basicSetup(ids);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        return {
            texts, cmpIds, root, history, tree,
        }
    };

    it("Simple commit data should change component data", () => {
        const {tree} = perform();
        tree.find("#commit").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 2/);
        expect(text).toMatch(/Data: 1/);
    });

    it("Simple commit with function data should change component data", () => {
        const {tree} = perform();
        tree.find("#commit-f").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 2/);
        expect(text).toMatch(/Data: 1/);
    });


    it("Consecutive commits should change component data", () => {
        const {tree} = perform();
        tree.find("#commit").simulate('click');
        tree.find("#commit").simulate('click');
        tree.find("#commit").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 4/);
        expect(text).toMatch(/Data: 3/);
    });

    it("Committing data should not refresh component inner state", () => {
        const {tree} = perform();
        tree.find("#increment").simulate("click");
        tree.find("#commit").simulate('click');
        tree.find("#commit-f").simulate('click');
        const text = tree.text();
        expect(text).toMatch(/Renders: 4/);
        expect(text).toMatch(/Count: 1/);
        expect(text).toMatch(/Data: 2/);
    });

    it("Comit -> next -> prev should keep committed data", () => {
        const {texts, cmpIds, tree} = perform();
        tree.find("#commit").simulate("click");
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        // Make sure we are on the next node
        expect(text).toContain(texts[cmpIds[1]]);
        tree.find("#previous-node").simulate('click');
        const text1 = tree.text();
        // Make sure we are on the previous node
        expect(text1).toContain(texts[cmpIds[0]]);

        expect(text1).toMatch(/Renders: 1/);
        expect(text1).toMatch(/Data: 1/);
    });

    it("Commit -> next -> next should keep committed data respectively (checked backwards)", () => {
        const {texts, cmpIds, tree} = perform();


        for (const dataTarget of [1, 2]) {
            tree.find("#next-node").simulate('click');
            tree.find("#commit").simulate("click");
            const text = tree.text();
            expect(text).toContain(texts[cmpIds[dataTarget]]);
            expect(text).toMatch(`Data: ${dataTarget}`);
        }

        for (const dataTarget of [0, 1].reverse()) {
            tree.find("#previous-node").simulate('click');
            const text = tree.text();
            expect(text).toContain(texts[cmpIds[dataTarget]]);
            expect(text).toMatch(`Data: ${dataTarget}`);
        }
    });


    it("Commit -> next -> commit -> back -> commit (x2) -> next should replace committed data", () => {
        const {texts, cmpIds, tree} = perform();

        tree.find("#commit").simulate("click");
        tree.find("#next-node").simulate('click');
        const text = tree.text();
        expect(text).toContain(texts[cmpIds[1]]);
        expect(text).toMatch(`Data: ${1}`);
        tree.find("#commit").simulate("click");
        const text1 = tree.text();
        expect(text1).toMatch(`Data: ${2}`);
        tree.find("#previous-node").simulate("click");
        const _text2 = tree.text();
        expect(_text2).toMatch(`Data: ${1}`);
        tree.find("#commit").simulate("click");
        tree.find("#commit").simulate("click");
        const text2 = tree.text();
        expect(text2).toMatch(`Data: ${3}`);
        tree.find("#next-node").simulate('click');
        const text3 = tree.text();
        expect(text3).toMatch(`Data: ${3}`);

    });


    it("Committing data should render the component only once", () => {
        const {tree} = perform();

        for (const _data of [1, 2, 3, 4]) {
            tree.find("#commit").simulate("click");
            const text = tree.text();
            expect(text).toMatch(`Data: ${_data}`);
            // + 1 counts as the render when mounted
            expect(text).toMatch(`Renders: ${_data + 1}`);
        }

    });

});


describe("Setting error flow should work correctly", () => {
    const ids = ["A", "B", "C"];

    const perform = () => {
        const {texts, cmpIds, root, history} = basicSetup(ids);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        return {
            texts, cmpIds, root, history, tree,
        }
    };

    it("Setting an error should be shown and render the component only once", () => {
        const {tree} = perform();
        {
            const text = tree.text();
            expect(text).toMatch("Renders: 1");
        }
        {
            tree.find('#error').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 2");
            expect(text).toMatch("Errors: This is an error");
        }
        {
            tree.find('#error').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 3");
            expect(text).toMatch("Errors: This is another error");
        }
    });

    it("Going to root node should flush the error", () => {
        const {tree} = perform();
        {
            const text = tree.text();
            expect(text).toMatch("Renders: 1");
        }
        {
            tree.find('#error').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 2");
            expect(text).toMatch("Errors: This is an error");
        }
        {
            tree.find('#root-node').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 3");
            expect(text).not.toMatch("Errors: This is another error");
        }
    });


    it("Going to next node should flush the error", () => {
        const {tree} = perform();
        {
            const text = tree.text();
            expect(text).toMatch("Renders: 1");
        }
        {
            tree.find('#error').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 2");
            expect(text).toMatch("Errors: This is an error");
        }
        {
            tree.find('#next-node').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 1");
            expect(text).not.toMatch("Errors: This is another error");
        }
    });

    it("Going to previous node should not flush the error; doing it twice will do", () => {
        const {tree, texts, cmpIds} = perform();
        {
            tree.find('#next-node').simulate('click');
            tree.find('#next-node').simulate('click');
            expect(tree.text()).toMatch(texts[cmpIds[2]])
        }
        {
            tree.find('#error').simulate('click');
            const text = tree.text();
            expect(text).toMatch("Renders: 2");
            expect(text).toMatch("Errors: This is an error");
        }
        {
            tree.find('#previous-node').simulate('click');
            const text = tree.text();
            expect(text).toMatch(texts[cmpIds[1]]);
            expect(text).toMatch("Renders: 1");
            expect(text).toMatch("Errors: This is an error");
        }
        {
            tree.find('#previous-node').simulate('click');
            const text = tree.text();
            expect(text).toMatch(texts[cmpIds[0]]);
            expect(text).toMatch("Renders: 1");
            expect(text).not.toMatch("Errors: This is an error");
        }
    });


});


describe("Previous data should work correctly", () => {
    const ids = ["A", "B", "C"];

    const perform = () => {
        const {texts, cmpIds, root, history} = basicSetup(ids);
        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} initialData={idata}/>
            </Router>,
        );
        return {
            texts, cmpIds, root, history, tree,
        }
    };

    it("First time rendering previousData will be the initial data", () => {
        const {tree} = perform();
        const text = tree.text();
        expect(text).toMatch(`PreviousData: ${idata.hallo}`);
    });

    it("Next node should display the same previous data", () => {
        const {tree} = perform();
        tree.find("#next-node").simulate("click");
        const text = tree.text();
        expect(text).toMatch(`PreviousData: ${idata.hallo}`);
    });

    it("Commit -> nextNode -> commit should show current and previous data accordingly", () => {
        const {tree} = perform();
        tree.find("#commit").simulate("click");
        tree.find("#next-node").simulate("click");
        tree.find("#commit").simulate("click");
        const text = tree.text();
        expect(text).toMatch(`PreviousData: ${idata.hallo + 1}`);
        expect(text).toMatch(`Data: ${idata.hallo + 2}`);
    });

    it("Commit -> nextNode -> commit -> previousNode should show current and previous data accordingly", () => {
        const {tree} = perform();
        tree.find("#commit").simulate("click");
        tree.find("#next-node").simulate("click");
        tree.find("#commit").simulate("click");
        const text = tree.text();
        expect(text).toMatch(`PreviousData: ${idata.hallo + 1}`);
        expect(text).toMatch(`Data: ${idata.hallo + 1}`);
    });

});


describe("Should call fallback when the url doesn't match any component's url", () => {
    const ids = ["A", "B", "C"];

    const perform = (fallback= jest.fn().mockReturnValue(false)) => {
        const {texts, cmpIds, root, history} = basicSetup(ids);

        // @ts-ignore
        root.routeProps.exact = true;
        // @ts-ignore
        root.children['B'].routeProps.exact = true;

        const tree = mount(
            <Router history={history}>
                <TreeSteps root={root} onFallback={fallback} initialData={idata}/>
            </Router>,
        );
        return {
            texts, cmpIds, root, history, tree, fallback
        }
    };


    it("Accessing a node by pushing history should fallback if invalid", () => {
        const {tree, texts, cmpIds, history, fallback} = perform();
        const text = tree.text();
        expect(text).toMatch(texts[cmpIds[0]]);
        act(() => {
            history.push("/paosjdopasd/asdasdjasf");
        });
        expect(fallback).toBeCalledTimes(1);
        expect(text).toMatch(texts[cmpIds[0]]);
        act(() => {
            history.push("/");
        });
        expect(fallback).toBeCalledTimes(1);
        expect(text).toMatch(texts[cmpIds[0]]);
    });


    it("Fallback that returns false should work as if no callback was provided", () => {
        const {tree, texts, cmpIds, history, fallback} = perform(jest.fn().mockReturnValue(false));
        const text = tree.text();
        expect(text).toMatch(texts[cmpIds[0]]);
        expect(fallback).toBeCalledTimes(0);
        tree.find("#next-node").simulate('click');
        expect(fallback).toBeCalledTimes(0);
        expect(tree.text()).toMatch(texts[cmpIds[1]]);
        act(() => {
            history.push("/zzasdasdasg/asfasdfs");
        });
        expect(fallback).toBeCalledTimes(1);
        expect(history.location.pathname).toBe("/");
    });

});