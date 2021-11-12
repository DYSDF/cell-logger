/* global describe it */
import chai from 'chai'
import Filter from '../src/filter'
import Path from '../src/path'
import { LEVEL } from '../src/enum'

chai.should()

describe('Filter', () => {
  describe('constructor', () => {
    it('should NOT throw', () => {
      new Filter()
      new Filter({
        log_level: -1,
        log_flags: []
      })
    })
  })

  describe('#equal', () => {
    const filter = new Filter({
      log_level: LEVEL.INFO,
      log_paths: [
        'foo/**'
      ]
    })
    it('should be equal true', () => {
      filter.exec(LEVEL.WARN, new Path('foo/bar')).should.to.be.equal(true)
    })
    it('should be equal false', () => {
      filter.exec(LEVEL.DEBUG, new Path('foo/bar')).should.to.be.equal(false)
    })
    it('should be equal false', () => {
      filter.exec(LEVEL.WARN, new Path('brz/bar')).should.to.be.equal(false)
    })
  })

  describe('#confirm env params', () => {
    // @ts-ignore
    global.__logger__ = {
      log_level: 'warn_err',
      log_paths: 'foo/**'
    }

    it('should be equal true', async () => {
      const { default: config } = await import('../src/config')
      const filter = new Filter(config)
      filter.exec(LEVEL.ERROR, new Path('foo/bar')).should.to.be.equal(true)
    })
    it('should be equal false', async () => {
      const { default: config } = await import('../src/config')
      const filter = new Filter(config)
      filter.exec(LEVEL.INFO, new Path('foo/bar')).should.to.be.equal(false)
    })
    it('should be equal false', async () => {
      const { default: config } = await import('../src/config')
      const filter = new Filter(config)
      filter.exec(LEVEL.ERROR, new Path('brz/bar')).should.to.be.equal(false)
    })
  })
})
