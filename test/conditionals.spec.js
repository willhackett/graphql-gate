import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { or } from '/src/conditionals'

chai.use(chaiAsPromised)
chai.should()

describe('Test conditional OR promise chain manipulator', () => {

  const resolved = () => Promise.resolve()
  const rejected = () => Promise.reject(new Error('test rejection'))

  it('should fulfill a set of resolving promises', () =>
    or([resolved, resolved, resolved])().should.be.fulfilled
  )

  it('should resolve a set of resolving and rejecting promises', () =>
    or([resolved, rejected, resolved])().should.be.fulfilled
  )

  it('should fulfill a single resolve (in array)', () =>
    or([resolved])().should.be.fulfilled
  )

  it('should fulfill a single resolve (not in an array)', () =>
    or(resolved)().should.be.fulfilled
  )

  it('should reject a set of rejecting promises', () =>
    or([rejected, rejected, rejected])().should.be.rejected
  )

  it('should reject a single rejecting promise (in array)', () =>
    or([rejected])().should.be.rejected
  )

  it('should reject a single rejecting promise (not in array)', () =>
    or(rejected)().should.be.rejected
  )
})
