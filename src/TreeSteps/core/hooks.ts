import React from "react";
import {useHistory} from "react-router-dom";

export const useChangingHistory = () => {
    const history = useHistory();
    const [innerHistory, setInnerHistory] = React.useState(history);
    const hRef = React.useRef(history);
    hRef.current = history;
    const unsub = React.useMemo(() => {
        return hRef.current.listen((h, action) => {
            setInnerHistory({...hRef.current});
        });
    }, []);
    React.useEffect(() => unsub, [unsub]);

    return innerHistory;
};