 import React from 'react';


export interface TransitionStates {
    enter: boolean; // It's set once when the transition starts
    afterEnter: boolean;  // It's set once when the transition starts and remains true

    entered: boolean; // It's set after enter transition is completed and remains true

    exit: boolean; // IT's set once when the transition ends
    afterExit: boolean;  // It's set once when the transition ends and remains true
    exited: boolean; // It's set after exit transition is completed and remains true
}

export type TransitionTimeouts = {
    enter: number;
    exit: number;
};

export type TransitionProps = {
    id: any;
    timeout: number | Partial<TransitionTimeouts>;
    ignoreOnMounted?: boolean;
    onExited?(): void;
    children(states: TransitionStates): React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "id">;


export const Transition: React.VFC<TransitionProps> = ({
    id,
    children,
    timeout,
    onExited,
    ignoreOnMounted,
    ...rest
}) => {

    const timeouts = React.useMemo(() => {
        if(typeof timeout === "number"){
            return {enter: timeout, exit: timeout};
        }
        return {
            exit: timeout.exit || 0,
            enter: timeout.enter || 0,
        };
    },[timeout]);

    const [states, setStates] = React.useState<TransitionStates>({
        enter: false,
        afterEnter: false,
        entered: false,
        exit: false,
        afterExit: false,
        exited: false,
    });

    const mounted = React.useRef(false);


    React.useLayoutEffect(() => {
        if(timeout === 0) {
            // For timeout 0 means no animation
            setStates({
                enter: false,
                afterEnter: true,
                entered: true,
                exit: false,
                afterExit: true,
                exited: true,
            });
            if(mounted.current || !ignoreOnMounted) {
                onExited?.();
            }
            mounted.current = true;
            return;
        }

        if(mounted.current || !ignoreOnMounted) {
            setStates({
                enter: true,
                afterEnter: true,
                entered: false,
                exit: false,
                afterExit: false,
                exited: false,
            });
            let lastTimeout = setTimeout(() => {
                setStates(prev => ({
                    ...prev,
                    enter: false,
                    entered: true,
                    exit: true,
                    afterExit: true,
                }));
                lastTimeout = setTimeout(() => {
                    onExited?.();
                    setStates(prev => ({
                        ...prev,
                        exit: false,
                        exited: true,
                    }));
                }, timeouts.exit);
            }, timeouts.enter);
            mounted.current = true;
            return () => {
                clearTimeout(lastTimeout);
            };
        }
        mounted.current = true;
    }, [id]);
    return <div {...rest}>
        {children(states)}
    </div>
};