export const Pending = 0;
export const Resolved = 1;
export const Rejected = 2;

const lazy = (ctor) => {
  //status表示组件状态，在初始时为-1，第一次载入时会马上变为0
  const lazyObj = {
    isLazyComponent: true,
    ctor: ctor,
    status: -1,
    result: null,
  };
  return lazyObj;
};

export default lazy;
