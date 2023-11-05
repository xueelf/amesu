/**
 * 对象深合并，用法与 `Object.assign()` 保持一致。
 *
 * @param target - 目标对象，接收源对象属性的对象，也是修改后的返回值。
 * @param sources - 源对象，包含将被合并的属性。
 * @returns 目标对象。
 */
export function deepAssign(target: Record<string, unknown>, ...sources: object[]): object {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    if (!source || typeof source !== `object`) {
      return target;
    }
    Object.entries(source).forEach(([key, value]) => {
      if (value instanceof Date) {
        target[key] = new Date(value);
        return;
      }
      if (value instanceof RegExp) {
        target[key] = new RegExp(value);
        return;
      }
      if (!value || typeof value !== `object`) {
        target[key] = value;
        return;
      }
      if (Array.isArray(value)) {
        target[key] = [];
      }
      if (typeof target[key] !== `object` || !target[key]) {
        target[key] = {};
      }
      deepAssign(target[key] as Record<string, any>, value);
    });
  }
  return target;
}
