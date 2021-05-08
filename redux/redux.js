export function createStore(reducer, initialState = {}, enhancer) {
  //enhancer通常是applyMiddleware的运行结果，而不是applyMiddleware本身，这个要注意

  //如果initialState没有传，但是enhancer参数传了，重置一下变量
  if (typeof initialState === "function" && typeof enhancer === "undefined") {
    enhancer = initialState;
    initialState = undefined;
  }
  //如果enhancer传了，但是不是函数，则报错提示，否则执行enhancer函数，
  //并继续执行enhancer函数返回的加强版的createStore函数，
  //参数reducer以及initialState和原createStore函数保持一致
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error("Expected the enhancer to be a function.");
    }
    return enhancer(createStore)(reducer, initialState);
  }
  //如果reducer不是函数，则报错
  if (typeof reducer !== "function") {
    throw new Error("Expected the reducer to be a function.");
  }

  let currentState = initialState || {};
  const subscribers = [];
  //防止在reducer中dispatch，一直递归
  let isDispatching = false;

  const getState = () => currentState;

  const subscribe = (subscriber) => {
    subscribers.push(subscriber);
  };

  const unsubscribe = (subscriber) => {
    const index = subscribers.indexOf(subscriber);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };

  const dispatch = (action) => {
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;

      //关键步骤
      //将state和action传递给reducer，所以这里并没有涉及任何action和reducer对应的代码
      currentState = reducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    subscribers.forEach((subscriber) => subscriber());
    return action;
  };

  return {
    getState,
    dispatch,
    subscribe,
    unsubscribe,
  };
}

export function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    let dispatch = store.dispatch;
    let chain = [];

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args),
    };
    //先将每个middleware处理一遍，将middlewareApi传进去，也就是运行中间件最外层的函数，得到接收next参数的那个函数
    chain = middlewares.map((middleware) => middleware(middlewareAPI));
    //再将所有的中间件compose为一个，这个dispatch为第一个中间件接收参数为action的那个函数
    dispatch = compose(...chain)(store.dispatch);

    //这里返回的是修改后的dispatch而不是原生的dispatch
    return {
      ...store,
      dispatch,
    };
  };
}

export function combineReducer(reducers) {
  const reducerKeys = Object.keys(reducers);

  //做一个拷贝，移除无效的reducer
  const finalReducers = {};

  //只有是函数的reducer才是有效地
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  //真正最外层的reducer，也就是在dispatch中调用的Reducer方法
  //可以看到state默认值是空对象，所以我们的state总是一个对象
  return function combination(state = {}, action) {
    //ignore irrelevant codes...

    let hasChanged = false;
    const nextState = {};

    //遍历所有reducer方法
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];

      //初始化时，这个值一般是undefined，因为此时state是空对象
      const previousStateForKey = state[key];

      //关键部分，我们写的reducer就是在这里被调用的
      //所以为什么reducer一定要设置一个默认值，就是保证子状态在初始化的时候也能被初始化
      //就是我们返回的新state/旧state
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;

      //这里会做一个浅比较
      //如果新旧state的引用地址改变了，就说明state改变了，
      //所以我们在写reducer时候，如果没匹配到任何action，就该直接返回入参state
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}

export function thunkMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      if (typeof action === "function") {
        return action(dispatch, getState, extraArgument);
      }

      //这个next在第一个中间件时是原生的dispatch
      //原生dispatch返回的是action
      //第二个中间件的next是第一个中间件的接收action的那个函数
      //第二个中间件又返回一个函数，它的action的那个函数被返回
      //它的action那个函数的内部调用第一个中间件的action的那个函数
      return next(action);
    };
  };
}

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  //开始时b实际上是next那个函数，它的返回值还是一个函数，它的内层函数才是返回action
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
  //简单举例，比如只有两个中间件，a和b，compose的返回值为(...args) => a(b(...args));
  //因为compose的返回值是一个函数，它执行时会这样compose(chain)(store.dispatch)
  //所以args其实就是dispatch
  //三个中间件更直观 fn1 fn2 fn3
  //第一次运行a为fn1, b为fn2， 完成后a变成(...args) => fn1(fn2(...args))
  //第二次运行a为(...args) => fn1(fn2(...args))，b为fn3，注意a接收的是b的运行结果，所以args为b(...args),完成后a变成(...args) => fn1(fn2(fn3(...args)))
  //当compose返回时传入dispatch，fn3拿到dispatch，返回接收action的那个函数给fn2作为next，这样子fn2有了next，返回自己的action入参的那个函数给fn1,作为next，
  //fn1有了next，它也返回自己的接收action的那个函数，所以compose(chain)(store.dispatch)的返回值是第一个中间件入参为action的那个函数，这样子所有的中间件都有自己的next这个环境变量了
  //只不过最后一个中间件拿到的是dispatch
  //中间件的运行顺序的fn1，fn2，fn3，最后原生的dispatch
  //fn1的接收的next为fn2接收action的那个函数，以此类推
}
