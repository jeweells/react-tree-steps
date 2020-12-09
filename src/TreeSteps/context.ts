import React from "react";
import {ITreeContext} from "./types";

export const TreeContext = React.createContext<ITreeContext>({
    nextNode: () => {
    },
    rootNode: () => {
    },
    previousNode: () => {
    },
});