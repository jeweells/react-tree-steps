import React from "react";
import {ITreeContext} from "./types";

export const TreeContext = React.createContext<ITreeContext<any, any>>({
    nextNode: () => {
    },
    rootNode: () => {
    },
    previousNode: () => {
    },
    data: {},
    commit(data: (<T>(prevState: any) => any) | any): void {
    },
    error: null,
    setError(error: (<TError>(prevState: (any | null)) => (any | null)) | any | null): void {
    }
});