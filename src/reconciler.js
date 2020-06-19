import {
  reservedAttrs
} from "./reserved_attrs";

import {
  getNearestParentDOMFiber,
  getNearestChildDOMFiber
} from "./utils";
import {
  UpdateQueue,
  Update
} from "./updateQueue";
import {
  resetCursor
} from "./hooks";
import {
  createTextElement
} from "./createElement";

import shallowEqual from "./shallowEqual";

// 正在调度的工作Root
let workInProgressRoot = null;
// 下一个被调度的Fiber
let nextUnitOfWork = null;
// 当前正在使用的RootFiber，也就是渲染结束后当前页面上的DOM对应的rootFiber
// 这个需要渲染（commit）成功之后再赋值， 简单来说，这个用来保存老的rootFiber
let currentRoot = null;

//是否应该更新
let shouldRender = null;

//用来存储删除的节点
//因为新老节点比较，如果新节点无法和老节点对应
//那么不知道对比的新老节点是不是同一个节点
//不可能在新节点Fiber上加DELETION的effectTag
//因为新的节点是要新增的，而老的节点是要删除的
//所以要给老的Fiber加上DELETION的标签然后单独放到deletions中
//统一进行删除
const deletions = [];

let workInProgressFiber = null;

export function getWIPFiber() {
  return workInProgressFiber;
}


function completeUnitOfWork(completeFiber) {
  //自身完成的时候要将自己的type从shouldRender上面清除
  if(shouldRender === completeFiber.type) {
    shouldRender = null;
  }
  // 收集副作用
  //首先拿到父fiber
  const returnFiber = completeFiber.parentFiber;
  //先将自己的firstEffect和lastEffect连接到父fiber上
  //当然要判断下有父fiber才执行
  if (returnFiber) {
    if (completeFiber.firstEffect || completeFiber.lastEffect) {
      //如果父fiber还没收集到任何Effect
      if (!returnFiber.firstEffect) {
        //将自己第一个Effect交给父fiber作为第一个Effect  
        returnFiber.firstEffect = completeFiber.firstEffect;

      } else {
        // 否则就是父fiber已经有Effect了，自己不是第一个
        //这种情况就将自己的firstEffect连接到父fiber的lastEffect后面
        //也就是父fiber的lastEffect的nextEffect指向自己的firstEffect
        returnFiber.lastEffect.nextEffect = completeFiber.firstEffect;

      }
      //执行完上面的操作后，自己的firstEffect都已经接到父fiber后面了
      //还要将自己的lastEffect交给父Fiber作为最后一个Effect
      returnFiber.lastEffect = completeFiber.lastEffect;
    }

    //上面只是将自己子fiber的Effect挂到了自己父fiber上面
    //因为自己身上的firstEffect和lastEffect都是自己子fiber的，而不是自己的
    //子fiber完成则自己完成，所以要将自己挂在EffectList的后面
    //也就是父fiber的lastEffect后面（本质上就是自己的lastEffect后面，但是自己的lastEffect已经赋值给了父fiber的lastEffect）

    //在挂载之前要先判断自己有没有effectTag，只有有effectTag才需要更新
    //这里加上SCU进行判断的原因是
    //当SCU为false时，自己是不需要更新（commit）的
    //自己不会执行componentDidUpdate方法
    if (completeFiber.effectTag && completeFiber.SCU) {
      //要先判断父fiber有没有firstEffect和lastEffect
      //因为可能自己是最里面的节点，没有子节点了，那么自己也没有lastEffect和firstEffect
      //自己的兄弟节点也没有firstEffect和lastEffect，所以即使进行了上面的步骤
      //父fiber的firstEffect和lastEffect也是没有的
      if (!returnFiber.firstEffect) {
        //父fiber没有firstEffect,自己成为firstEffect和lastEffect
        returnFiber.firstEffect = completeFiber;
        returnFiber.lastEffect = completeFiber;
      } else {
        //父fiber有firstEffect
        //先将父fiber的lastEffect的nextEffect指向自己
        returnFiber.lastEffect.nextEffect = completeFiber;
        //然后自己成为父fiber的最后一个effect（lastEffect）
        returnFiber.lastEffect = completeFiber;
      }
    }
  }
}

function createFiber(parentFiber, oldFiber, newChild, index, reusable, effectTag) {
  const parentFiberIsContextConsumer = parentFiber.type && parentFiber.type._isContextConsumer;
  if (parentFiberIsContextConsumer) {
    if (typeof newChild !== "function") {
      console.error("The child node of the Consumer component must be a function!");
      return;
    }
  }

  if (typeof newChild === "function") {
    newChild = newChild(parentFiberIsContextConsumer ? parentFiber.stateNode.currentValue.value : undefined);
    newChild = (typeof newChild === "string" || typeof newChild === "number") ? createTextElement(newChild) : newChild;
  }
  let newFiber = {
    type: newChild.type,
    props: newChild.props,
    stateNode: reusable ? oldFiber.stateNode : null,
    parentFiber: parentFiber,
    alternate: reusable ? oldFiber : null,
    effectTag: effectTag,
    updateQueue: reusable && oldFiber.updateQueue ? oldFiber.updateQueue : typeof newChild.type === "function" ? new UpdateQueue() : null,
    index: index,
    nextEffect: null,
    SCU: true
  };

  return newFiber;

}

function reconcileChildren(fiber, children) {
  //在开始的开始，我们首先要将children拍平
  //为什么要拍平呢？因为当child使用map遍历返回的是一个数组
  //所以child有可能是一个数组，出现children中嵌套了数组的情况
  children = children.flat();
  // 首先要为所有子节点创建fiber
  // 初始化序列（子节点的遍历序号）
  let index = 0;
  //保留上一个创建的fiber的引用
  let prevFiber = null;
  //初始化oldFiber为旧Fiber的第一个子Fiber（假如有）
  let oldFiber = fiber.alternate && fiber.alternate.childFiber;
  if (oldFiber) {
    //保留一下第一个oldFiber
    const firstOldFiber = oldFiber;
    //判断第一个子节点有没有key，如果有则默认所有子节点含有key
    //否则默认所有的都没有key
    const hasKey = (children && children[0] && children[0].props && children[0].props.key) ? true : false;
    let hasSameKey = false;
    if (hasKey) {
      //如果有key就先把所有的旧节点保存到Map中
      const oldFibersMap = new Map();
      //保留第一次的oldFiber，因为如果有相同的key那么就按普通的方式一一比对

      //采集到所有老Fiber
      while (oldFiber) {
        //如果有相同key，报错并且跳出遍历，按照普通的方式来diff
        if (oldFibersMap.has(oldFiber.props.key)) {
          console.error(`Nodes cannot have the same key attribute(${oldFiber.props.key})`);
          hasSameKey = true;
          break;
        } else {
          oldFibersMap.set(oldFiber.props.key, oldFiber);
          oldFiber = oldFiber.siblingFiber;
        }

      }

      //判断有没有相同的key，没有相同的key才进行key比对
      if (!hasSameKey) {
        //基准
        let lastPlaceIndex = 0;
        while (index < children.length) {
          const newChild = children[index];
          const newChildKey = newChild.props.key;
          const theOld = oldFibersMap.get(newChildKey);
          let newFiber = null;
          if (theOld && theOld.type === newChild.type) {
            if (theOld.index >= lastPlaceIndex) {
              lastPlaceIndex = theOld.index;
              newFiber = createFiber(fiber, theOld, newChild, index, true, "UPDATE");
            } else {
              newFiber = createFiber(fiber, theOld, newChild, index, true, "PLACEMENT");
            }
            //只要复用了的就将map中对应的去除掉
            oldFibersMap.delete(newChildKey);
          } else {
            newFiber = createFiber(fiber, theOld, newChild, index, false, "PLACEMENT");
          }

          //如果是第一个子节点，
          //那么就将它赋值给父节点的childFiber
          if (index === 0) {
            fiber.childFiber = newFiber;
          } else {
            //否则就跟在上一个子fiber的后面
            if (newFiber) {
              prevFiber.siblingFiber = newFiber;
            }
          }
          //将新生成的fiber赋值给上一个fiber
          prevFiber = newFiber;
          //更新至下一个newChild
          index++;
        }

        //遍历剩余的oldFibersMap，这些是没复用到的，删除
        for (const [key, value] of oldFibersMap) {
          value.effectTag = "DELETION";
          deletions.push(value);
        }
      }

    }

    if (!hasKey || hasSameKey) {
      //没有key就只能判断type是否相同
      //如果是存在相同key进入的这个分支，那么需要重置oldFiber
      if (hasSameKey) {
        oldFiber = firstOldFiber;
      }

      while (index < children.length || oldFiber) {
        const newChild = children[index];
        const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
        let newFiber = null;
        if (sameType) {
          newFiber = createFiber(fiber, oldFiber, newChild, index, true, "UPDATE");
        } else {
          if (newChild) {
            newFiber = createFiber(fiber, oldFiber, newChild, index, false, "PLACEMENT");
          }
          if (oldFiber) {
            oldFiber.effectTag = "DELETION";
            deletions.push(oldFiber);
          }
        }

        //更新oldFiber
        if (oldFiber) {
          oldFiber = oldFiber.siblingFiber;
        }

        if (index === 0) {
          fiber.childFiber = newFiber;
        } else {
          if (newFiber) {
            prevFiber.siblingFiber = newFiber;
          }
        }
        prevFiber = newFiber;
        index++;
      }
    }
  } else {
    //第一次渲染
    while (index < children.length) {
      const newChild = children[index];
      let newFiber = null;
      if (newChild) {
        newFiber = createFiber(fiber, null, newChild, index, false, "PLACEMENT");
      }

      if (index === 0) {
        fiber.childFiber = newFiber;
      } else {
        if (newFiber) {
          prevFiber.siblingFiber = newFiber;
        }
      }
      prevFiber = newFiber;
      index++;
    }
  }

}

function createDOM(fiber) {
  if (fiber.type === "TEXT_ELEMENT") {
    return document.createTextNode(fiber.props.value);
  } else {
    const DOM = document.createElement(fiber.type);
    updateDOM(DOM, {}, fiber.props);
    return DOM;
  }
}

function updateDOM(DOM, oldProps, newProps) {
  if (DOM && DOM.setAttribute) {
    setProps(DOM, oldProps, newProps);
  }
}

function setProps(DOM, oldProps, newProps) {
  //首先遍历老属性
  for (let key in oldProps) {
    //不设置保留属性
    if (!reservedAttrs.includes(key)) {
      //如果老的有，新的也有，就更新
      if (newProps.hasOwnProperty(key)) {
        if (newProps[key] !== oldProps[key]) {
          setProp(DOM, key, newProps[key]);
        }
      } else {
        //老的有，新的没有，删除
        //要判断是不是事件，如果是事件要解绑
        if (key.startsWith("on") && oldProps[key] instanceof Function) {
          const eventType = key.slice(2).toLowerCase();
          DOM[`on${eventType}`] = null;
        } else {
          DOM.removeAttribute(key);
        }
      }
    }
  }

  //然后遍历新属性
  for (let key in newProps) {
    //不设置保留属性
    if (!reservedAttrs.includes(key)) {
      //老的没有，新的有
      if (!oldProps.hasOwnProperty(key)) {
        setProp(DOM, key, newProps[key]);
      }
    }
  }
}

function setProp(DOM, key, value) {
  //简单处理事件
  if (key.startsWith("on") && value instanceof Function) {
    const eventType = key.slice(2).toLowerCase();
    DOM[`on${eventType}`] = value;
  } else if (key === "style") {
    //处理样式
    if (typeof value === "string") {
      DOM.style.cssText = value;
    } else if (typeof value === "object") {
      for (let styleName in value) {
        DOM.style[styleName] = value[styleName];
      }
    }
  } else {
    DOM.setAttribute(key, value);
  }
}

function bindRef(fiber) {
  if (fiber.props.hasOwnProperty("ref")) {
    fiber.props.ref.current = fiber.stateNode;
  }
}

function updateClassComponent(fiber) {
  
  if (!fiber.stateNode) {
    //类组件的stateNode不是真实DOM节点
    //而是组件的实例（也就是fiber.type的实例，fiber.type是一个类）
    fiber.stateNode = new fiber.type(fiber.props);
    //然后实例上挂载上Fiber
    //双向指向
    fiber.stateNode.internalFiber = fiber;
    //同时，要给类组件的Fiber上挂载updateQueue
    fiber.updateQueue = new UpdateQueue();
  }

  //设置context为contextType
  //在这里设置而不是在组件实例内部的构造器中设置
  //是因为复用实例时不会执行构造函数，但是每次更新都要同步更新的context
  //不能让context一直是实例构建时获取的初始值
  fiber.stateNode.context = (fiber.stateNode.constructor.contextType &&
    fiber.stateNode.constructor.contextType.Provider &&
    fiber.stateNode.constructor.contextType.Provider.currentValue);

  bindRef(fiber);


  // 保存旧的props
  const oldProps = fiber.stateNode.props;
  //如果是复用的旧实例，还要更新上面的props
  fiber.stateNode.props = fiber.props;

  //保存旧的state
  const oldState = fiber.stateNode.state;
  //给组件实例的state赋值
  //新的state = 调用更新队列更新，将老的state传进去
  //会在更新队列都更新合并后返回新的state
  fiber.stateNode.state = fiber.updateQueue.forceUpdate(fiber.stateNode.state);

  //简单比较state和props是否有改变
   const shouldUpdate = !shallowEqual(oldProps, fiber.stateNode.props) || !shallowEqual(oldState, fiber.stateNode.state);

  function runGetDerivedStateFromProps() {
    //getDerivedState运行在SCU和render之前
    //它的参数为nextProps以及prevState
    //prevState是本次setState完成之后的state
    if (fiber.stateNode.constructor.getDerivedStateFromProps) {
      const nextProps = fiber.stateNode.props;
      const prevState = fiber.stateNode.state;
      const returnState = fiber.stateNode.constructor.getDerivedStateFromProps(nextProps, prevState);
      if (returnState) {
        fiber.stateNode.state = {
          ...fiber.stateNode.state,
          ...returnState
        };
      }
    }
  }
  //SCU返回false时虽然不执行render以及处理子节点的更新
  //但是它自身的state和props还是要修改的
  //所以把SCU放到这位置，上面已经进行了更新，但是到这里这里直接返回
  //不处理后面
  let child = null;
  const haveSCU = fiber.stateNode && fiber.stateNode.shouldComponentUpdate;
  const notFirstReconcile = fiber.alternate;

  //非第一次渲染
  if(notFirstReconcile) {
    //state或props有变化的情况
    if(shouldUpdate) {
      //更新了自然要运行getDerivedStateFromProps
      runGetDerivedStateFromProps();
      //自身的state和props有变化是不管父组件的
      //这种情况只要考虑SCU的返回是false还是true
      if((haveSCU && fiber.stateNode.shouldComponentUpdate()) || (!haveSCU)) {
        //当自身的状态改变，同时shouldRender无值时
        //将自身的type赋给shouldRender
        if (!shouldRender) {
          shouldRender = fiber.type;
        }
        child = fiber.stateNode.render();
      } else if(haveSCU && !fiber.stateNode.shouldComponentUpdate()) {
        child = fiber.alternate.currentChildVNode;
        fiber.SCU = false;
      }
    } else {
      //state或props无变化的情况
      //这种情况就复杂一点，因为可能自身无变化但是父组件render了
      //这样的情况子组件也要render
      //同样的，getDerivedStateFromProps和shouldComponentUpdate也要酌情考虑是否要运行
      if(shouldRender) {
        child = fiber.state.render();
      } else {
        child = fiber.alternate.currentChildVNode;
        fiber.SCU = false;
      }
    }

  } else {
    //第一次渲染
    child = fiber.stateNode.render();
  }

  fiber.currentChildVNode = child;
  
  //组件只有一个最外层元素，顶层必须用一个标签包裹，
  //所以只有一个子节点
  //我们给这个子节点包装成数组
  const children = [child];
  //调和它的子节点
  reconcileChildren(fiber, children);
}

function updateFunctionComponent(fiber) {
  //当前是好函数组件，让WIPFiber当前的fiber
  //这是为了告知hooks当前调度的fiber是哪个fiber
  workInProgressFiber = fiber;
  //并且让当前hooks索引重置为0
  resetCursor();
  //让新Fiber上的hooks初始化为空数组
  workInProgressFiber.hooks = {
    list: [],
    effects: [],
    layouts: []
  };
  //调和子节点
  const child = fiber.type(fiber.props);
  reconcileChildren(fiber, [child]);
}

function updateHostComponent(fiber) {
  if (!fiber.stateNode) {
    fiber.stateNode = createDOM(fiber);
  }

  bindRef(fiber);

  const children = fiber && fiber.props && fiber.props.children;
  // 调度子节点
  reconcileChildren(fiber, children);
}


//调度每个工作单元
function performUnitOfWork(fiber) {
  //我们要判断传进来的fiber对应的元素类型
  //是函数组件还是类组件或者就是一段jsx而已
  //我们默认在类组件中有一个静态属性_isClassComponent
  const type = fiber.type;
  //是类组件
  if (type instanceof Function && type._isClassComponent) {
    updateClassComponent(fiber);
  } else if (type instanceof Function) {
    //是函数组件
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  //当上面执行完成后
  //即使是rootFiber也会挂载上child
  //这时需要返回下一个工作单元
  //顺序为有childFiber返回childFiber
  //没有返回fiber的siblingFiber
  if (fiber.childFiber) {
    return fiber.childFiber;
  }

  //首先让下一个fiber初始化为当前fiber
  let nextFiber = fiber;
  while (nextFiber) {
    //没有儿子则自己调度完成了
    completeUnitOfWork(nextFiber);
    //如果有兄弟返回兄弟
    if (nextFiber.siblingFiber) {
      return nextFiber.siblingFiber;
    }
    //没有兄弟则先让nextFiber为父Fiber
    //这样父Fiber可以完成
    //并且会走nextFiber.siblingFiber返回兄弟节点
    //也就是子fiber的叔叔节点
    nextFiber = nextFiber.parentFiber;
  }

}

//commit有两个任务
//一是commit
//二是返回下一个Effect
function commit(workEffect) {
  //首先拿到父Fiber对应的DOM
  const nearestParentDOMFiber = getNearestParentDOMFiber(workEffect.parentFiber);
  const nearestParentDOM = nearestParentDOMFiber && nearestParentDOMFiber.stateNode;
  const nearestChildDOMFiber = getNearestChildDOMFiber(workEffect);
  const nearestChildDOM = nearestChildDOMFiber && nearestChildDOMFiber.stateNode;

  const effectTag = workEffect.effectTag;
  const type = typeof workEffect.type;

  if (effectTag === "DELETION") {
    if (workEffect.hooks) {
      cleanupHooks(workEffect.hooks.list);
    }
    if (workEffect.stateNode && workEffect.stateNode.componentWillUnmount) {
      workEffect.stateNode.componentWillUnmount();
    }

    nearestParentDOM && nearestParentDOM.removeChild(nearestChildDOM);
  } else if (type === "function") {
    //如果是函数组件或者类组件
    //没有DOM 它们只需要调用副作用即可
    if (workEffect.hooks && workEffect.hooks.layouts) {
      runSideEffect(workEffect.hooks.layouts);
    }

    if (workEffect.hooks && workEffect.hooks.effects) {
      requestIdleCallback(() => {
        runSideEffect(workEffect.hooks.effects);
      }, {
        timeout: 500
      });
    }

    if (workEffect.stateNode && workEffect.stateNode.componentDidMount && workEffect.effectTag === "PLACEMENT" && !workEffect.alternate) {
      workEffect.stateNode.componentDidMount();
    }

    if (workEffect.stateNode && workEffect.stateNode.componentDidUpdate && workEffect.effectTag === "UPDATE" && workEffect.alternate) {
      workEffect.stateNode.componentDidUpdate();
    }

  } else if (effectTag === "UPDATE") {
    if (workEffect.type === "TEXT_ELEMENT") {
      if (workEffect.alternate.props.value !== workEffect.props.value) {
        workEffect.stateNode.textContent = workEffect.props.value;
      }
    } else {
      updateDOM(workEffect.stateNode, workEffect.alternate.props, workEffect.props);
    }
  } else {
    nearestParentDOM && nearestParentDOM.appendChild(nearestChildDOM);
  }

  //最后还要将当前fiber的effectTag清空
  workEffect.effectTag = null;
  //最后返回下一个Effect
  return workEffect.nextEffect;
}

function cleanupHooks(hooks) {
  while (hooks.length > 0) {
    const hook = hooks.shift();
    const cleanup = hook.cleanup;
    cleanup && cleanup();
  }
}

function runSideEffect(effects) {
  while (effects.length > 0) {
    const effect = effects.shift();
    effect.cleanup && effect.cleanup();
    const cleanup = effect.effect();
    effect.hook.cleanup = cleanup;
  }
}


function commitRoot() {
  //提交阶段

  //先提交所有的要删除的节点
  deletions.forEach(deletion => {
    commit(deletion);
  });

  deletions.length = 0;

  //首先拿到第一个Effect，也就是根Fiber的firstEffect
  //根Fiber也就是执行中的Fiber，即workInProgressRoot
  let workEffect = workInProgressRoot && workInProgressRoot.firstEffect;
  //循环commit每一个Effect
  while (workEffect) {
    workEffect = commit(workEffect);
  }

  //commit结束，将currentRoot设置为workInProgressRoot
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;

}

// 调度函数
// requestIdleCallback会传递deadline进来
function workLoop(deadline) {
  // 如果有空闲时间并且有未调度完成的工作单元就一直执行
  while (deadline.timeRemaining() > 1 && nextUnitOfWork) {
    //下一个工作单元为performUnitOfWork的返回值
    //也就是说performUnitOfWork在调度完成后要返回下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  // 如果没有工作单元了，则代表render阶段完成，进入commit阶段
  if (!nextUnitOfWork) {
    commitRoot();
  } else {
    //否则就是空闲时间不够了，但还有剩余的工作单元，再次调用requestIdleCallback
    //等待下一次空闲调度
    requestIdleCallback(workLoop, {
      timeout: 500
    });
  }

}

export function reconcileRoot(rootFiber) {
  //如果有currentRoot，说明不是第一次渲染
  //那么就给rootFiber的alternate赋值为老的rootFiber
  //alternate可以理解为代替者，也就是新的RootFiber替换旧的RootFiber
  if (currentRoot) {
    //如果没有传rootFiber
    //则复用正在运行的rootFiber的所有属性
    if (!rootFiber) {
      rootFiber = {
        ...currentRoot
      };
    }
    rootFiber.alternate = currentRoot;
  }
  workInProgressRoot = rootFiber;
  nextUnitOfWork = workInProgressRoot;

  //每次重渲染都将根节点上挂载的effect清除
  //因为如果不传rootFiber进来，那么workInProgress就会复用上次的根Fiber
  //如果上面的effect不清除掉可能会有问题
  workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;

  // 开始调度
  requestIdleCallback(workLoop, {
    timeout: 500
  });

}