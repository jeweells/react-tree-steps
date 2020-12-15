import * as React from "react";
import {AllowedOptions, findNextNode, findPreviousNode, hasOption} from "../index";
import {buildSimpleCompactNodes} from "./utils";

it("AllowedOptions default option should be equal to use all options", () => {
    expect(AllowedOptions.ALL).toBe(
        AllowedOptions.TUNNEL |
        AllowedOptions.PATH,
    )
});


it("hasOption of AllowedOptions should work properly", () => {
    expect(hasOption(AllowedOptions.ALL, AllowedOptions.TUNNEL)).toBe(true);
    expect(hasOption(AllowedOptions.TUNNEL, AllowedOptions.PATH)).toBe(false);
    expect(hasOption(AllowedOptions.ALL & ~AllowedOptions.TUNNEL, AllowedOptions.TUNNEL)).toBe(false);
    expect(hasOption(AllowedOptions.ALL & ~AllowedOptions.TUNNEL, AllowedOptions.PATH)).toBe(true);
});

describe("Find next/previous node", () => {
    it("Finding next node", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const node = findNextNode(rootNode);
        expect(node).toBe(rootNode?.children[0]);
    });

    it("Finding next node when there's not one", () => {
        const rootNode = buildSimpleCompactNodes(1);
        const node = findNextNode(rootNode);
        expect(node).toBeFalsy();
    });


    it("Finding previous node", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const node = findPreviousNode(rootNode?.children[0] || null);
        expect(node).toBe(rootNode);
    });

    it("Finding previous node when there's not one", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const node = findPreviousNode(rootNode);
        expect(node).toBeFalsy();
    });




    it("Finding next node when using ignoreAccessOfPreviousNode should skip the next node", () => {
        const rootNode = buildSimpleCompactNodes(5);
        if(rootNode) {
            rootNode.children[0].options.ignoreAccessOfPreviousNode = true;
        }
        const node = findNextNode(rootNode);
        expect(node).toBe(rootNode?.children[0].children[0]);
    });



    it("Finding previous node when using ignoreAccessOfNextNode should skip the previous node", () => {
        const rootNode = buildSimpleCompactNodes(5);
        if(rootNode) {
            rootNode.children[0].options.ignoreAccessOfNextNode = true;
        }
        const node = findPreviousNode(rootNode?.children[0].children[0] || null);
        expect(node).toBe(rootNode);
    });




});


describe('Finding next nodes using options', function () {

    it("Finding next node using deep", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 1,
            }
        });
        expect(node).toBe(rootNode?.children[0]);
    });

    it("Finding next node using invalid deep", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const node1 = findNextNode(rootNode, {
            selector: {
                deep: 100,
            }
        });
        expect(node1).toBeFalsy();
        const node2 = findNextNode(rootNode, {
            selector: {
                deep: 100,
                child: anotherChild?.name,
            }
        });
        expect(node2).toBeFalsy();
        const node3 = findNextNode(rootNode, {
            selector: {
                deep: 100,
                child: 0
            }
        });
        expect(node3).toBeFalsy();
    });


    it("Finding next node using child", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                child: 1
            }
        });
        expect(node).toBe(rootNode?.children[1]);
    });

    it("Finding 2nd next node using deep", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 2,
            }
        });
        expect(node).toBe(rootNode?.children[0].children[0]);
    });

    it("Finding 2nd next node using deep and child", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 2,
                child: 1,
            }
        });
        expect(node).toBe(anotherChild);
    });

    it("Finding 2nd next node using deep and invalid child", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 2,
                child: 2,
            }
        });
        expect(node).toBeFalsy();
    });

    it("Finding 2nd next node using deep and child name", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 2,
                child: anotherChild?.name,
            }
        });
        expect(node).toBe(anotherChild);
    });

    it("Finding 2nd next node using deep and invalid child name", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                deep: 2,
                child: rootNode?.children[0].name,
            }
        });
        expect(node).toBeFalsy();
    });


    it("Finding next node using full name path", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(3, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                path: [
                    rootNode?.children[0].name as string,
                    anotherChild?.name as string,
                    anotherChild?.children[0].name as string,
                    anotherChild?.children[0].children[0].name as string,
                ],
            }
        });
        expect(node).toBe(anotherChild?.children[0].children[0]);
    });

    it("Finding next node using mixed path (name and number)", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(3, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                path: [
                    rootNode?.children[0].name as string,
                    1,
                    anotherChild?.children[0].name as string,
                    0,
                ],
            }
        });
        expect(node).toBe(anotherChild?.children[0].children[0]);
    });

    it("Finding next node using number path", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(3, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                path: [
                    0,
                    1,
                    0,
                    0,
                ],
            }
        });
        expect(node).toBe(anotherChild?.children[0].children[0]);
    });


    it("Finding next node using invalid full name path", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(3, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                path: [
                    rootNode?.children[0].name as string,
                    anotherChild?.name as string,
                    "asodjasodj",
                    anotherChild?.children[0].children[0].name as string,
                ],
            }
        });
        expect(node).toBeFalsy();
        const node2 = findNextNode(rootNode, {
            selector: {
                path: [
                    "asodjasodj",
                ],
            }
        });
        expect(node2).toBeFalsy();
    });

    it("Finding next node using invalid full number path", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(3, 0, "x");
        if(anotherChild) {
            rootNode?.children[0].children.push(anotherChild);
        }
        const node = findNextNode(rootNode, {
            selector: {
                path: [
                    0,
                    1,
                    2,
                    3,
                ],
            }
        });
        expect(node).toBeFalsy();
        const node2 = findNextNode(rootNode, {
            selector: {
                path: [
                    10,
                ],
            }
        });
        expect(node2).toBeFalsy();
    });

});



describe('Finding previous nodes using options', function () {

    it("Finding previous node using parent number", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if (anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const startNode = rootNode?.children[0].children[0].children[0] || null;
        const node = findPreviousNode(startNode, {
            parent: 2
        });
        expect(startNode).toBeTruthy();
        expect(node).toBe(startNode?.parent?.parent);
    });


    it("Finding previous node using parent name", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if (anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const startNode = rootNode?.children[0].children[0].children[0] || null;
        const node = findPreviousNode(startNode, {
            parent: startNode?.parent?.parent?.name,
        });
        expect(startNode).toBeTruthy();
        expect(node).toBe(startNode?.parent?.parent);
    });


    it("Finding previous node using invalid parent number", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if (anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const startNode = rootNode?.children[0].children[0].children[0] || null;
        const node = findPreviousNode(startNode, {
            parent: 100,
        });
        expect(startNode).toBeTruthy();
        expect(node).toBeFalsy();
    });


    it("Finding previous node using invalid parent name", () => {
        const rootNode = buildSimpleCompactNodes(5);
        const anotherChild = buildSimpleCompactNodes(1, 0, "x");
        if (anotherChild) {
            rootNode?.children.push(anotherChild);
        }
        const startNode = rootNode?.children[0].children[0].children[0] || null;
        const node = findPreviousNode(startNode, {
            parent: startNode?.children[0].name,
        });
        expect(startNode).toBeTruthy();
        expect(node).toBeFalsy();
    });

});