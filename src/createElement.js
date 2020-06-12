export function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      value: text,
      children: []
    }
  };
}

export const createElement = (type, attrs = {}, ...children) => {
  let vNode = {
    type,
    props: {
      ...attrs,
      //这里为了后续方便处理，将字符串统一生成为对象的形式
      children: children.map(child => {
        return typeof child === "string" || typeof child === "number" ? createTextElement(child) : child;
      }) || []
    }
  };
  return vNode;
};