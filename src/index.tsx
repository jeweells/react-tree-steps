import {createBrowserHistory} from "history";
import * as React from "react";
import {render} from "react-dom";
import {Router} from "react-router-dom";
import {TreeSteps} from "./TreeSteps";
import {TreeNodeComponentProps, TreeNodeInfo} from "./TreeSteps/types";

const history = createBrowserHistory();
const idata = {
  hallo: 0
};

const cmp = (txt: string) => (props: TreeNodeComponentProps<typeof idata>) => {
  const [r] = React.useState({ renders: 0 });

  const [count, setCount] = React.useState(0);

  r.renders += 1;
  return (
    <div>
      {txt}, Renders: {r.renders}, Count: {count}
      <br />
      <button onClick={() => setCount((p) => p - 1)}>Decrement</button>
      <button onClick={() => setCount((p) => p + 1)}>Increment</button>
      <br />
      <button onClick={() => props.previousNode()}>Previous node</button>
      <button onClick={() => props.rootNode()}>Root node</button>
      <button onClick={() => props.nextNode()}>Next node</button>
    </div>
  );
};

const root: TreeNodeInfo<{}, typeof idata> = {
  component: cmp("A"),
  routeProps: {
    path: "/"
  },
  children: {
    b1: {
      component: cmp("B1"),
      routeProps: {
        path: "/b1"
      },
      children: {
        c1: {
          component: cmp('C1'),
          routeProps: {
            path: "/b1/c1"
          }
        }
      }
    },
    b2: {
      component: cmp("B2"),
      routeProps: {
        path: "/b2"
      }
    }
  }
};

const rootElement = document.getElementById("root");
render(
  <Router history={history}>
    <TreeSteps root={root} initialData={idata} />
  </Router>,
  rootElement
);
