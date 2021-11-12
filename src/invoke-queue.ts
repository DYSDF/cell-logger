/**
 *
 * 由于log方法涉及DB日志存储空间大小的改写，
 * 这些方法被异步执行时可能会发生竞态条件导致DB内数据不准确，
 * 进而导致已存储的日志超过存储空间限制这类问题，
 * 因此需要内部维护该执行列表，确保这些方法按序执行。
 *
 */

interface IOperation {
  handler: Function;
  resolve: Function;
  reject: Function;
}

const OPERATION_QUEUE: IOperation[] = [];

let isExecuting: boolean = false;

// 优先尝试调用浏览器的requestIdleCallback方法，减少对UI影响
const idleCallback: Function = (function() {
  // @ts-ignore
  if (typeof requestIdleCallback === 'function') return requestIdleCallback
  return (cb: (...args: any[]) => void, ...args: any[]) => setTimeout(cb, ...args)
})()

const startQueueExecution = (): void => {
  while (OPERATION_QUEUE.length > 0 && !isExecuting) {
    const operation = OPERATION_QUEUE.shift() as IOperation;
    isExecuting = true;
    try {
      operation.resolve(operation.handler())
    } catch (e) {
      operation.reject(e)
    }
    isExecuting = false;
    idleCallback(startQueueExecution)
  }
}

export function invokeInQueue(handler: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    OPERATION_QUEUE.push({
      handler,
      resolve,
      reject
    });
    startQueueExecution();
  });
}
