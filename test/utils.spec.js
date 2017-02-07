import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { mapObject, promiseChain, hasKeys } from '/src/utils'

chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.should()

describe('tests for mapObject util', () => {
  // dummy object
  const obj = { a: 1, b: 2 }

  it('should successfully map to correct values', () => {
    mapObject(obj, i => i * 2).should.deep.equal({ a: 2, b: 4 })
  })

  it('should make the keys available', () => {
    const sp = sinon.spy()
    mapObject(obj, sp)
    sp.should.have.been.calledTwice
    sp.should.have.been.calledWith(1, 'a')
    sp.should.have.been.calledWith(2, 'b')
    sp.reset()
  })
})

describe('tests for promiseChain util', () => {

  const resolved = () => Promise.resolve()
  const rejected = () => Promise.reject(new Error('test rejection'))

  it('should fulfill an empty resolve list', () =>
    promiseChain([], resolved).should.be.fulfilled
  )

  it('should fulfill an array running resolves', () =>
    promiseChain([1,2,3], resolved).should.be.fulfilled
  )

  it('should reject a list containing any rejection', () =>
    promiseChain([1], rejected).should.be.rejected
  )

  it('should return the last resolve item in the chain', () =>
    promiseChain([1,2,3], i => i).then(res => {
      res.should.equal(3)
    }).should.be.fulfilled
  )
})

describe('tests for hasKeys util', () => {

  const obj = {
    one: 'two',
    three: 'four',
    5: 6
  }

  it('should be true for correct single keys', () => {
    hasKeys(obj, [5]).should.be.true
  })

  it('should be true for a mixture of found/unfound keys', () => {
    hasKeys(obj, ['one', 'three', 8, 'seven']).should.be.true
  })

  it('should be true for all correct keys', () => {
    hasKeys(obj, ['one', 'three', 5]).should.be.true
  })

  it('should be false for single missing key', () => {
    hasKeys(obj, ['test']).should.be.false
  })

  it('should be false for set of missing keys', () => {
    hasKeys(obj, ['a', 'b']).should.be.false
  })

  it('should be false for blank call', () => {
    hasKeys().should.be.false
  })

  it('should be false for called without keys', () => {
    hasKeys(obj).should.be.false
  })
})
