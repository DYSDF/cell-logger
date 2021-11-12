/* global describe it */
import chai, { expect } from 'chai'
import Path from '../src/path'

chai.should()

describe('Path', () => {
  describe('constructor', () => {
    it('should NOT throw', () => {
      new Path('foo')
      new Path('foo/bar')
      new Path('foo/*')
      new Path('foo/*/**/bar')
    })

    it('should throw', () => {
      const p1 = new Path('foo/bar')
      const p2 = new Path('foo/*')
      expect(p1.match.bind(p1, p2)).to.throw('被匹配的路径不可包含通配符(*或**).')
    })
  })

  describe('#equal', () => {
    tryMatch('foo/bar', 'foo/bar')

    tryNotMatch('foo/bar', 'foo/baz')
    tryNotMatch('foo/baz', 'foo/bar')
  })

  describe('#match', () => {
    it('should be matched', () => {
      const p1 = new Path('foo/bar')
      const str = 'foo/bar'

      p1.match(str).should.be.eq(true)
    })

    it('should NOT be matched', () => {
      const p1 = new Path('foo/bar')
      const str = 'foo/baz'

      p1.match(str).should.be.eq(false)
    })
  })

  describe('#wildcard', () => {
    tryMatch('foo/*', 'foo/bar')
    tryMatch('foo/*', 'foo/bar/baz')

    tryNotMatch('foo/*', 'foo')
    tryNotMatch('foo/*', 'fuu/bar')
  })

  describe('#double wildcard', () => {
    tryMatch('foo/**/baz', 'foo/b/a/r/baz')
    tryMatch('foo/**/*', 'foo/b/a/r/baz')
    tryMatch('foo/**', 'foo/bar')
    tryMatch('foo/**', 'foo/bar/baz')
    tryMatch('foo/**/bar/baz', 'foo/a/bar/b/bar/baz')

    tryNotMatch('foo/**', 'foo')
    tryNotMatch('foo/**', 'fuu')
    tryNotMatch('foo/**', 'fuu/bar/baz')
    tryNotMatch('foo/**/baz', 'foo/b/a/r/baby')
  })
})

function tryMatch(str1: string, str2: string) {
  it(`should be matched: ${str1} => ${str2}`, () => {
    const p1 = new Path(str1)
    const p2 = new Path(str2)
    p1.match(p2).should.be.eq(true)
  })
}

function tryNotMatch(str1: string, str2: string) {
  it(`should NOT be matched: ${str1} => ${str2}`, () => {
    const p1 = new Path(str1)
    const p2 = new Path(str2)
    p1.match(p2).should.be.eq(false)
  })
}
