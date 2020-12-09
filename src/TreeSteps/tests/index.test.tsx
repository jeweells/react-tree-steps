import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {configure, mount, render, shallow, ShallowWrapper} from "enzyme";
import * as React from "react";
import {act} from "react-dom/test-utils";
import {Router, useHistory} from "react-router-dom";
import {TreeSteps} from "../index";
import {createMemoryHistory} from "history";
import {TreeNodeComponentProps, TreeNodeInfo} from "../types";
import {basicSetup, cmp, idata} from "./utils";



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
