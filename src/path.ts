const WILDCARD = "*";

export default class Path {
  private _sections: Array<string>;

  constructor(path: string) {
    this._sections = (path || "").toString()
      .split(/\/+/)
      .map(i => i.trim())
      .filter(el => el.length);

    if (!this._sections.length) {
      console.warn(`不建议使用空字符串("${path}")构造Path实例.`);
    }
  }

  get sections() {
    return this._sections.slice()
  }

  toString(): string {
    return this._sections.join('/');
  }

  equal(tester: string | Path): boolean {
    return this.toString() === tester.toString();
  }

  /**
   * 对目标路径进行匹配检查
   * @param {string|Path} tester 被检测路径
   * @returns
   */
  match(tester: string | Path): boolean {
    if (tester.toString().indexOf(WILDCARD) !== -1) {
      throw new Error("被匹配的路径不可包含通配符(*或**).");
    }
    const examiner = new RegExp('^' + this.sections.join('/').replace('**', '.+').replace('*', '[^/]+'))
    return examiner.test(tester.toString())
  }
}
