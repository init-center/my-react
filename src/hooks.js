import {
  getWIPFiber,
  reconcileRoot
} from "./reconciler";
import {
  UpdateQueue,
  Update
} from "./updateQueue";

let cursor = 0;

//导出一个可以重置索引的函数
export const resetCursor = () => {
  cursor = 0;
}


export const useReducer = (reducer, initialState) => {
  //获取当前正在调和的Fiber
  const WIPFiber = getWIPFiber();
  //先看看老Fiber上有没有对应的Hook
  const oldHook = getHook(WIPFiber, cursor);

  //不管有没有老Hook，新Hook都指向老Hook
  let newHook = oldHook;

  if (oldHook) {
    //如果有老Hook，运行老Hook的更新队列更新
    //传入老的state更新完毕得到新的state
    newHook.state = oldHook.updateQueue.forceUpdate(oldHook.state);
  } else {
    //对应索引没有老Hook的情况下，创建新Hook
    //每个Hook有一个state属性，对应hook值
    //同时有一个更新队列，实现队列更新
    newHook = {
      state: initialState,
      updateQueue: new UpdateQueue()
    }
  }

  //dispatch即为给hook设置值的函数
  //也就是hook返回的数组的第二个值
  //接收一个action
  const dispatch = action => {
    //dispatch其实就是给对应hook的更新队列增加一个更新
    newHook.updateQueue.enqueue(new Update(
      //判断reducer有没有来进行不同的操作
      //useState是useReducer的语法糖
      //它的做法就是不传reducer
      reducer ? reducer(newHook.state, action) : action
    ));

    //dispatch的最后要重新调度根节点
    reconcileRoot();
  }
  //给当前的fiber的hooks对应的索引挂载新hook
  WIPFiber.hooks.list[cursor++] = newHook;
  //返回hook
  return [newHook.state, dispatch];
}

export const useState = (initialState) => {
  return useReducer(null, initialState);
}


export const useMemo = (cb, deps) => {
  const WIPFiber = getWIPFiber();
  const oldHook = getHook(WIPFiber, cursor);
  let newHook = oldHook;
  if (oldHook) {
    if (isChanged(oldHook.deps, deps)) {
      oldHook.deps = deps;
      oldHook.state = cb();
    }
  } else {
    newHook = {
      state: cb(),
      deps: deps
    }
  }
  WIPFiber.hooks.list[cursor++] = newHook;
  return newHook.state;
}

export const useCallback = (cb, deps) => {
  return useMemo(() => cb, deps);
}

export const useRef = (current) => {
  return useMemo(() => ({
    current
  }), []);
}

export const useContext = (context) => {
  return context && context.Provider && context.Provider.currentValue;
}

export const useEffect = (cb, deps) => {
  effectImpl(cb, deps, "effects");
}

export const useLayoutEffect = (cb, deps) => {
  effectImpl(cb, deps, "layouts");
}

const effectImpl = (cb, deps, type) => {
  const WIPFiber = getWIPFiber();
  const oldHook = getHook(WIPFiber, cursor);
  let newHook = oldHook;
  if (oldHook) {
    if (isChanged(oldHook.deps, deps)) {
      oldHook.deps = deps;
      WIPFiber.hooks[type].push({
        //每个effect上的hook保存对应的hook
        //方便在上面挂清理函数
        hook: oldHook,
        //拿到老hook的清理函数
        cleanup: oldHook.cleanup,
        effect: cb
      });
    }
  } else {
    newHook = {
      effect: cb,
      deps: deps
    }
    WIPFiber.hooks[type].push({
      hook: newHook,
      cleanup: null,
      effect: cb
    });
  }
  WIPFiber.hooks.list[cursor++] = newHook;
}

const isChanged = (oldDeps, newDeps) => {
  //Array.prototype.some() 只要有一个为true就为true
  return !oldDeps || newDeps.some((dep, index) => dep !== oldDeps[index]);
}

const getHook = (WIPFiber, cursor) => {
  //获取老Hook，从老Fiber身上的hooks属性上面取
  //取的是当前索引的hook
  //每个新Function Fiber调和时，会重置索引
  //所以每次都从0开始取
  //每次取完以后索引自增
  return WIPFiber && WIPFiber.alternate && WIPFiber.alternate.hooks &&
    WIPFiber.alternate.hooks.list && WIPFiber.alternate.hooks.list[cursor];
}