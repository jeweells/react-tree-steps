import {CompactTreeNodeInfo} from "../../types";

export const buildSimpleCompactNodes = (
    deep: number,
    index = 0,
    name: string = "cmp"
): CompactTreeNodeInfo<any, any> | null => {
    if(index < deep) {

        const n = buildSimpleCompactNodes(deep, index + 1, name);
        const cmp = {
            component: () => null,
            options: {},
            children: n ? [n] : [],
            name: name + index,
            id: name + index,
            routeProps: {}
        };
        if(n) {
            n.parent = cmp;
        }
        return cmp;
    }
    return null;
};