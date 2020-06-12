export class Update {
  payload = null;
  nextUpdate = null;
  constructor(payload) {
    this.payload = payload;
  }
}

//单链表
export class UpdateQueue {
  firstUpdate = null;
  lastUpdate = null;

  constructor() {

  }

  enqueue(update) {
    if (!this.lastUpdate) {
      //如果没有lastUpdate说明还没有任何update
      this.firstUpdate = update;
      this.lastUpdate = update;
    } else {
      //否则接在后面
      this.lastUpdate.nextUpdate = update;
      this.lastUpdate = update;
    }
  }

  forceUpdate(state) {
    let currentUpdate = this.firstUpdate;
    while (currentUpdate) {
      const nextState = typeof currentUpdate.payload === "function" ? currentUpdate.payload(state) : currentUpdate.payload;
      //合并老state和新state
      if(typeof state === "object") {
        state = {...state, ...nextState};
      } else {
        state = nextState;
      }
      
      currentUpdate = currentUpdate.nextUpdate;
    }
    //更新合并完成还要清空更新队列
    this.firstUpdate = null;
    this.lastUpdate = null;
    return state;
  }
}