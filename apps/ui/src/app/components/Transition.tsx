import React, { useRef, useEffect, useContext, FC } from 'react';
import { CSSTransition as ReactCSSTransition } from 'react-transition-group';
import { TransitionProps } from 'react-transition-group/Transition';

const TransitionContext = React.createContext({
    parent: {} as Partial<TransitionProps>
});

function useIsInitialRender() {
    const isInitialRender = useRef(true);
    useEffect(() => {
        isInitialRender.current = false;
    }, []);
    return isInitialRender.current;
}

const CSSTransition: FC<Partial<TransitionProps<HTMLElement>>> = ({
    show,
    enter = '',
    enterStart = '',
    enterEnd = '',
    leave = '',
    leaveStart = '',
    leaveEnd = '',
    appear,
    unmountOnExit,
    tag = 'div',
    children,
    ...rest
}) => {
    const enterClasses = enter.split(' ').filter((s: string) => s.length);
    const enterStartClasses = enterStart.split(' ').filter((s: string) => s.length);
    const enterEndClasses = enterEnd.split(' ').filter((s: string) => s.length);
    const leaveClasses = leave.split(' ').filter((s: string) => s.length);
    const leaveStartClasses = leaveStart.split(' ').filter((s: string) => s.length);
    const leaveEndClasses = leaveEnd.split(' ').filter((s: string) => s.length);
    const removeFromDom = unmountOnExit;

    function addClasses(node: HTMLElement | null, classes: string[]) {
        classes.length && node && node.classList.add(...classes);
    }

    function removeClasses(node: HTMLElement | null, classes: string[]) {
        classes.length && node && node.classList.remove(...classes);
    }

    const nodeRef = React.useRef<HTMLElement>(null);
    const Component = tag;

    return (
        <ReactCSSTransition
            appear={appear}
            nodeRef={nodeRef}
            unmountOnExit={removeFromDom}
            in={show}
            addEndListener={(done) => {
                nodeRef.current?.addEventListener('transitionend', done, false);
            }}
            onEnter={() => {
                if (!removeFromDom && nodeRef.current)
                    nodeRef.current.style.display = 'initial';
                addClasses(nodeRef.current, [...enterClasses, ...enterStartClasses]);
            }}
            onEntering={() => {
                removeClasses(nodeRef.current, enterStartClasses);
                addClasses(nodeRef.current, enterEndClasses);
            }}
            onEntered={() => {
                removeClasses(nodeRef.current, [...enterEndClasses, ...enterClasses]);
            }}
            onExit={() => {
                addClasses(nodeRef.current, [...leaveClasses, ...leaveStartClasses]);
            }}
            onExiting={() => {
                removeClasses(nodeRef.current, leaveStartClasses);
                addClasses(nodeRef.current, leaveEndClasses);
            }}
            onExited={() => {
                removeClasses(nodeRef.current, [...leaveEndClasses, ...leaveClasses]);
                if (!removeFromDom && nodeRef.current)
                    nodeRef.current.style.display = 'none';
            }}
        >
            <Component ref={nodeRef} {...rest} style={{ display: !removeFromDom ? 'none' : null }}>{children}</Component>
        </ReactCSSTransition>
    );
};

const Transition: FC<Partial<TransitionProps<HTMLElement>>> = ({ show, appear, ...rest }) => {
    const { parent } = useContext(TransitionContext);
    const isInitialRender = useIsInitialRender();
    const isChild = show === undefined;

    if (isChild) {
        return (
            <CSSTransition
                appear={parent['appear'] || !parent['isInitialRender']}
                show={parent['show']}
                {...rest}
            />
        );
    }

    return (
        <TransitionContext.Provider
            value={{
                parent: {
                    show,
                    isInitialRender,
                    appear
                }
            }}
        >
            <CSSTransition appear={appear} show={show} {...rest} />
        </TransitionContext.Provider>
    );
};

export default Transition;